const cron = require("node-cron");
const Appointment = require("../models/Appointment");
const Notification = require("../models/Notification");
const { dispatchNotification } = require("../services/notification.service");
const logger = require("../utils/logger");

const FREQUENCY_HOURS = {
  "once daily":        24,
  "twice daily":       12,
  "three times daily":  8,
  "four times daily":   6,
  "every 8 hours":      8,
  "every 12 hours":    12,
  "weekly":           168,
  "as needed":        null,
};

const getIntervalHours = (frequency) => {
  const key = frequency.toLowerCase().trim();
  return FREQUENCY_HOURS[key] ?? 24;
};

// ─── Medication reminders ─────────────────────────────────────────────────────
const runMedicationReminders = async () => {
  const now = new Date();
  // Use 60 days to cover appointments with long prescriptions (up to 30 days duration
  // from a slot that could be up to 30 days ago)
  const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

  const appointments = await Appointment.find({
    status: "completed",
    "prescription.0": { $exists: true },
    slotStart: { $gte: sixtyDaysAgo },
  })
    .populate("patientId", "name email")
    .lean();

  if (appointments.length === 0) return;

  let remindersSent = 0;

  for (const appt of appointments) {
    for (const item of appt.prescription) {
      const intervalHours = getIntervalHours(item.frequency);
      if (!intervalHours) continue;

      const lastReminder = await Notification.findOne({
        appointmentId: appt._id,
        type: "medication_reminder",
        status: "sent",
        "emailPayload.subject": { $regex: item.medicine, $options: "i" },
      })
        .sort({ lastAttemptAt: -1 })
        .lean();

      const referenceTime = (lastReminder?.lastAttemptAt)
        ? new Date(lastReminder.lastAttemptAt)
        : new Date(appt.slotStart);

      const hoursSinceLastReminder = (now - referenceTime) / (1000 * 60 * 60);
      if (hoursSinceLastReminder < intervalHours) continue;

      const durationElapsed =
        (now - new Date(appt.slotStart)) / (1000 * 60 * 60 * 24) >= item.durationDays;
      if (durationElapsed) continue;

      const daysSinceAppointment = Math.floor((now - new Date(appt.slotStart)) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.max(0, item.durationDays - daysSinceAppointment);

      const notification = await Notification.create({
        type: "medication_reminder",
        recipientId: appt.patientId._id,
        appointmentId: appt._id,
        status: "queued",
        emailPayload: {
          to: appt.patientId.email,
          subject: `Medication Reminder - ${item.medicine}`,
          body: `Dear ${appt.patientId.name},\n\nThis is your scheduled reminder to take your medication:\n\nMedicine: ${item.medicine}\nDosage: ${item.dosage}\nFrequency: ${item.frequency}\nRemaining: ${remainingDays} day(s) left.\n${item.notes ? `\nNotes: ${item.notes}` : ""}\n\nStay healthy!`,
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

// ─── Appointment reminders (24 hours before) ─────────────────────────────────
// Bug fix: dedup check now includes "queued" status to prevent duplicate notifications
// when the job runs again before the first queued notification is dispatched
const runAppointmentReminders = async () => {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const upcoming = await Appointment.find({
    status: "confirmed",
    slotStart: { $gte: in24h, $lte: in25h },
  })
    .populate("patientId", "name email")
    .populate("doctorId", "name")
    .lean();

  if (upcoming.length === 0) return;

  let sent = 0;
  for (const appt of upcoming) {
    // Check both "sent" and "queued" to avoid creating duplicate notifications
    const alreadyExists = await Notification.findOne({
      appointmentId: appt._id,
      type: "reminder",
      status: { $in: ["sent", "queued"] },
    }).lean();

    if (alreadyExists) continue;

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
        subject: "Appointment Reminder - Tomorrow",
        body: `Dear ${appt.patientId.name},\n\nThis is a reminder that you have an appointment with Dr. ${appt.doctorId.name} tomorrow.\n\nDate & Time: ${slotDate}\n\nPlease remember to bring any previous reports or prescriptions.\n\nSee you soon!`,
      },
    });

    await dispatchNotification(notification);
    sent++;
  }

  if (sent > 0) logger.info(`Appointment reminder job: sent ${sent} reminder(s)`);
};

// ─── Scheduler ────────────────────────────────────────────────────────────────
const start = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      await runAppointmentReminders();
    } catch (err) {
      logger.error(`Appointment reminder job error: ${err.message}`);
    }
  });

  cron.schedule("30 * * * *", async () => {
    try {
      await runMedicationReminders();
    } catch (err) {
      logger.error(`Medication reminder job error: ${err.message}`);
    }
  });

  logger.info("Appointment reminder job scheduled - runs every hour at :00");
  logger.info("Medication reminder job scheduled - runs every hour at :30");
};

module.exports = { start };
