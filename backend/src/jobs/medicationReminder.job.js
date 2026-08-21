const cron = require("node-cron");
const Appointment = require("../models/Appointment");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { dispatchNotification } = require("../services/notification.service");
const logger = require("../utils/logger");

// ─── Frequency → hours between reminders ─────────────────────────────────────
// Maps prescription frequency strings to reminder intervals.
// The job checks every hour and sends a reminder when the interval has elapsed
// since the last reminder (or since the appointment completed if first reminder).
const FREQUENCY_HOURS = {
  "once daily":    24,
  "twice daily":   12,
  "three times daily": 8,
  "four times daily":  6,
  "every 8 hours": 8,
  "every 12 hours": 12,
  "weekly":        168,
  "as needed":     null, // no automated reminder for PRN medications
};

const getIntervalHours = (frequency) => {
  const key = frequency.toLowerCase().trim();
  return FREQUENCY_HOURS[key] ?? 24; // default to once daily if unrecognised
};

// ─── Core reminder logic ──────────────────────────────────────────────────────
const runMedicationReminders = async () => {
  const now = new Date();

  // Find all completed appointments that have prescriptions
  // Only look at appointments completed in the last 30 days to keep the query bounded
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const appointments = await Appointment.find({
    status: "completed",
    "prescription.0": { $exists: true }, // has at least one prescription item
    slotStart: { $gte: thirtyDaysAgo },
  })
    .populate("patientId", "name email")
    .lean();

  if (appointments.length === 0) return;

  let remindersSent = 0;

  for (const appt of appointments) {
    for (const item of appt.prescription) {
      const intervalHours = getIntervalHours(item.frequency);
      if (!intervalHours) continue; // skip "as needed" medications

      // Check when the last medication reminder was sent for this appointment + medicine
      const lastReminder = await Notification.findOne({
        appointmentId: appt._id,
        type: "medication_reminder",
        status: "sent",
        "emailPayload.subject": { $regex: item.medicine, $options: "i" },
      })
        .sort({ lastAttemptAt: -1 })
        .lean();

      const referenceTime = lastReminder
        ? new Date(lastReminder.lastAttemptAt)
        : new Date(appt.slotStart); // first reminder anchored to appointment time

      const hoursSinceLastReminder = (now - referenceTime) / (1000 * 60 * 60);

      if (hoursSinceLastReminder < intervalHours) continue;

      // Check if the prescription duration has elapsed
      const durationElapsed =
        (now - new Date(appt.slotStart)) / (1000 * 60 * 60 * 24) > item.durationDays;
      if (durationElapsed) continue;

      // Build and dispatch the reminder
      const notification = await Notification.create({
        type: "medication_reminder",
        recipientId: appt.patientId._id,
        appointmentId: appt._id,
        status: "queued",
        emailPayload: {
          to: appt.patientId.email,
          subject: `Medication Reminder — ${item.medicine}`,
          body: `Dear ${appt.patientId.name},\n\nThis is your scheduled reminder to take your medication:\n\nMedicine: ${item.medicine}\nDosage: ${item.dosage}\nFrequency: ${item.frequency}\n\nRemaining duration: ${item.durationDays} day(s) from your appointment date.\n${item.notes ? `\nNotes: ${item.notes}` : ""}\n\nStay healthy!`,
        },
      });

      await dispatchNotification(notification);
      remindersSent++;
    }
  }

  if (remindersSent > 0) {
    logger.info(`Medication reminder job: sent ${remindersSent} reminder(s)`);
  }
};

// ─── Appointment reminder (24 hours before) ───────────────────────────────────
// Sends a reminder email to patients 24 hours before their confirmed appointment.
const runAppointmentReminders = async () => {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  // Find confirmed appointments in the 24-25 hour window
  const upcoming = await Appointment.find({
    status: "confirmed",
    slotStart: { $gte: in24h, $lte: in25h },
  })
    .populate("patientId", "name email")
    .populate("doctorId", "name")
    .lean();

  if (upcoming.length === 0) return;

  for (const appt of upcoming) {
    // Avoid duplicate reminders — check if one was already sent for this appointment
    const alreadySent = await Notification.findOne({
      appointmentId: appt._id,
      type: "reminder",
      status: "sent",
    }).lean();

    if (alreadySent) continue;

    const slotDate = new Date(appt.slotStart).toLocaleString("en-IN", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const notification = await Notification.create({
      type: "reminder",
      recipientId: appt.patientId._id,
      appointmentId: appt._id,
      status: "queued",
      emailPayload: {
        to: appt.patientId.email,
        subject: "Appointment Reminder — Tomorrow",
        body: `Dear ${appt.patientId.name},\n\nThis is a reminder that you have an appointment with Dr. ${appt.doctorId.name} tomorrow.\n\nDate & Time: ${slotDate}\n\nPlease remember to bring any previous reports or prescriptions.\n\nSee you soon!`,
      },
    });

    await dispatchNotification(notification);
  }

  if (upcoming.length > 0) {
    logger.info(`Appointment reminder job: queued ${upcoming.length} reminder(s)`);
  }
};

// ─── Scheduler ────────────────────────────────────────────────────────────────
const start = () => {
  // Appointment reminders — runs every hour
  cron.schedule("0 * * * *", async () => {
    try {
      await runAppointmentReminders();
    } catch (err) {
      logger.error(`Appointment reminder job error: ${err.message}`);
    }
  });

  // Medication reminders — runs every hour
  cron.schedule("30 * * * *", async () => {
    try {
      await runMedicationReminders();
    } catch (err) {
      logger.error(`Medication reminder job error: ${err.message}`);
    }
  });

  logger.info("Medication reminder job scheduled — runs every hour at :30");
  logger.info("Appointment reminder job scheduled — runs every hour at :00");
};

module.exports = { start };
