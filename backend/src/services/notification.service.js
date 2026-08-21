const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendEmail } = require("./email.service");
const logger = require("../utils/logger");

const MAX_RETRIES = Number(process.env.MAX_NOTIFICATION_RETRIES) || 5;

// ─── Exponential backoff ──────────────────────────────────────────────────────
// Retry delays: 1min, 2min, 4min, 8min, 16min
const nextRetryDelay = (retryCount) => Math.pow(2, retryCount) * 60 * 1000;

// ─── Core dispatcher ──────────────────────────────────────────────────────────
// Picks up a single queued notification, attempts to send it,
// and updates its status. Called by the retry job and inline after booking.
const dispatchNotification = async (notification) => {
  try {
    await sendEmail(notification.emailPayload);

    await Notification.findByIdAndUpdate(notification._id, {
      status: "sent",
      lastAttemptAt: new Date(),
      errorMessage: null,
    });

    logger.info(`Notification ${notification._id} sent [type: ${notification.type}]`);
  } catch (err) {
    const newRetryCount = notification.retryCount + 1;
    const exhausted = newRetryCount >= MAX_RETRIES;

    await Notification.findByIdAndUpdate(notification._id, {
      status: exhausted ? "failed" : "queued",
      retryCount: newRetryCount,
      lastAttemptAt: new Date(),
      nextRetryAt: exhausted ? null : new Date(Date.now() + nextRetryDelay(newRetryCount)),
      errorMessage: err.message,
    });

    logger.warn(
      `Notification ${notification._id} failed (attempt ${newRetryCount}/${MAX_RETRIES}): ${err.message}`
    );
  }
};

// ─── Queue helpers ────────────────────────────────────────────────────────────
// Each helper writes a Notification document (outbox pattern) then immediately
// attempts to dispatch it. If dispatch fails, the retry job picks it up later.

const queueAndDispatch = async (notificationData) => {
  const notification = await Notification.create(notificationData);
  // Fire-and-forget dispatch — failure is handled inside dispatchNotification
  dispatchNotification(notification).catch((e) =>
    logger.error(`Unexpected dispatch error for ${notification._id}: ${e.message}`)
  );
  return notification;
};

// ─── Booking confirmation ─────────────────────────────────────────────────────
const queueConfirmationNotification = async (appointment) => {
  const [patient, doctor] = await Promise.all([
    User.findById(appointment.patientId).lean(),
    User.findById(appointment.doctorId).lean(),
  ]);
  if (!patient || !doctor) return;

  const slotDate = new Date(appointment.slotStart).toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return queueAndDispatch({
    type: "confirmation",
    recipientId: patient._id,
    appointmentId: appointment._id,
    emailPayload: {
      to: patient.email,
      subject: "Appointment Confirmed",
      body: `Dear ${patient.name},\n\nYour appointment with Dr. ${doctor.name} has been confirmed.\n\nDate & Time: ${slotDate}\n\nPlease arrive 10 minutes early. If you need to cancel, do so at least 2 hours in advance.\n\nThank you.`,
    },
  });
};

// ─── Appointment reminder ─────────────────────────────────────────────────────
const queueReminderNotification = async (appointment) => {
  const [patient, doctor] = await Promise.all([
    User.findById(appointment.patientId).lean(),
    User.findById(appointment.doctorId).lean(),
  ]);
  if (!patient || !doctor) return;

  const slotDate = new Date(appointment.slotStart).toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return queueAndDispatch({
    type: "reminder",
    recipientId: patient._id,
    appointmentId: appointment._id,
    emailPayload: {
      to: patient.email,
      subject: "Appointment Reminder — Tomorrow",
      body: `Dear ${patient.name},\n\nThis is a reminder that you have an appointment with Dr. ${doctor.name} tomorrow.\n\nDate & Time: ${slotDate}\n\nPlease remember to bring any previous reports or prescriptions.\n\nSee you soon!`,
    },
  });
};

// ─── Cancellation ─────────────────────────────────────────────────────────────
const queueCancellationNotification = async (appointment) => {
  const [patient, doctor] = await Promise.all([
    User.findById(appointment.patientId).lean(),
    User.findById(appointment.doctorId).lean(),
  ]);
  if (!patient || !doctor) return;

  const slotDate = new Date(appointment.slotStart).toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const reason = appointment.cancellationReason || "No reason provided.";

  return queueAndDispatch({
    type: "cancellation",
    recipientId: patient._id,
    appointmentId: appointment._id,
    emailPayload: {
      to: patient.email,
      subject: "Appointment Cancelled",
      body: `Dear ${patient.name},\n\nYour appointment with Dr. ${doctor.name} on ${slotDate} has been cancelled.\n\nReason: ${reason}\n\nPlease rebook at your convenience.\n\nThank you.`,
    },
  });
};

// ─── Medication reminders ─────────────────────────────────────────────────────
// Creates one notification per prescription item.
// The medication reminder cron job (Task 11) will dispatch these at the right time.
const queueMedicationReminders = async (appointment) => {
  if (!appointment.prescription || appointment.prescription.length === 0) return;

  const patient = await User.findById(appointment.patientId).lean();
  if (!patient) return;

  const notifications = appointment.prescription.map((item) => ({
    type: "medication_reminder",
    recipientId: patient._id,
    appointmentId: appointment._id,
    status: "queued",
    emailPayload: {
      to: patient.email,
      subject: `Medication Reminder — ${item.medicine}`,
      body: `Dear ${patient.name},\n\nThis is a reminder to take your medication:\n\nMedicine: ${item.medicine}\nDosage: ${item.dosage}\nFrequency: ${item.frequency}\nDuration: ${item.durationDays} day(s)${item.notes ? `\nNotes: ${item.notes}` : ""}\n\nPlease follow your doctor's instructions carefully.\n\nStay healthy!`,
    },
  }));

  await Notification.insertMany(notifications);
  logger.info(
    `Queued ${notifications.length} medication reminder(s) for appointment ${appointment._id}`
  );
};

// ─── Retry worker ─────────────────────────────────────────────────────────────
// Called by the notification retry cron job (Task 11).
// Picks up all queued notifications whose nextRetryAt has passed and dispatches them.
const processRetryQueue = async () => {
  const now = new Date();

  const pending = await Notification.find({
    status: "queued",
    $or: [
      { nextRetryAt: null },               // first attempt — never tried yet
      { nextRetryAt: { $lte: now } },      // retry window has elapsed
    ],
  }).limit(50); // process in batches to avoid memory spikes

  if (pending.length === 0) return;

  logger.info(`Notification retry worker: processing ${pending.length} queued notification(s)`);

  // Dispatch concurrently but cap at 10 parallel sends to avoid SMTP rate limits
  const chunks = [];
  for (let i = 0; i < pending.length; i += 10) chunks.push(pending.slice(i, i + 10));

  for (const chunk of chunks) {
    await Promise.allSettled(chunk.map(dispatchNotification));
  }
};

module.exports = {
  dispatchNotification,
  queueConfirmationNotification,
  queueReminderNotification,
  queueCancellationNotification,
  queueMedicationReminders,
  processRetryQueue,
};
