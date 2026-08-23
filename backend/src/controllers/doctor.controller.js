const mongoose = require("mongoose");
const { body, param, validationResult } = require("express-validator");
const Appointment = require("../models/Appointment");
const AppointmentStatusHistory = require("../models/AppointmentStatusHistory");
const DoctorProfile = require("../models/DoctorProfile");
const Notification = require("../models/Notification");
const User = require("../models/User");
const logger = require("../utils/logger");

// LLM + notification services — lazy import so doctor routes work even before those tasks
let llmService;
try { llmService = require("../services/llm.service"); } catch (_) {}

let notificationService;
try { notificationService = require("../services/notification.service"); } catch (_) {}

let calendarService;
try { calendarService = require("../services/calendar.service"); } catch (_) {}

// ─── Validation ───────────────────────────────────────────────────────────────

exports.notesValidation = [
  param("id").isMongoId().withMessage("Valid appointment id is required"),
  body("postVisitNotes")
    .trim().notEmpty().withMessage("Post-visit notes are required")
    .isLength({ max: 5000 }).withMessage("Post-visit notes must be under 5000 characters."),
  body("prescription").optional().isArray().withMessage("Prescription must be an array"),
  body("prescription.*.medicine").notEmpty().withMessage("Medicine name is required"),
  body("prescription.*.dosage").notEmpty().withMessage("Dosage is required"),
  body("prescription.*.frequency").notEmpty().withMessage("Frequency is required"),
  body("prescription.*.durationDays").isInt({ min: 1 }).withMessage("Duration must be at least 1 day"),
];

exports.leaveValidation = [
  body("dates").isArray({ min: 1 }).withMessage("dates must be a non-empty array of YYYY-MM-DD strings"),
  body("dates.*")
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("Each date must be in YYYY-MM-DD format")
    .custom((val) => {
      const today = new Date(); today.setUTCHours(0, 0, 0, 0);
      if (new Date(val) < today) throw new Error(`Cannot mark leave for a past date: ${val}`);
      return true;
    }),
];

// ─── GET /api/doctor/appointments ────────────────────────────────────────────
// Doctor views their upcoming / all appointments with patient info
exports.getDoctorAppointments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { doctorId: req.user.id };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate("patientId", "name email phone")
      .sort({ slotStart: 1 })
      .lean();

    res.status(200).json({ appointments });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/doctor/appointments/:id ────────────────────────────────────────
// Single appointment detail — includes pre-visit summary and status history
exports.getDoctorAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctorId: req.user.id,
    })
      .populate("patientId", "name email phone")
      .lean();

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found." });

    const history = await AppointmentStatusHistory.find({
      appointmentId: req.params.id,
    })
      .sort({ timestamp: 1 })
      .lean();

    res.status(200).json({ appointment, history });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/doctor/appointments/:id/notes ─────────────────────────────────
// Doctor submits post-visit notes + prescription
// Triggers: LLM post-visit summary, medication reminder notifications, calendar update
exports.submitNotes = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    const { postVisitNotes, prescription = [] } = req.body;
    const appointmentId = req.params.id;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId: req.user.id,
      status: "confirmed",
    });

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found or not in confirmed status." });

    // Generate post-visit summary via LLM (non-blocking — fallback on failure)
    let postVisitSummary = null;
    if (llmService) {
      postVisitSummary = await llmService.generatePostVisitSummary(postVisitNotes, prescription);
    }

    // Transition confirmed → completed
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      appointment.postVisitNotes = postVisitNotes;
      appointment.prescription   = prescription;
      appointment.postVisitSummary = postVisitSummary;
      appointment.status = "completed";
      await appointment.save({ session });

      await AppointmentStatusHistory.create(
        [{
          appointmentId,
          fromStatus: "confirmed",
          toStatus: "completed",
          reason: "Doctor submitted post-visit notes",
          changedBy: req.user.id,
        }],
        { session }
      );

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    logger.info(`Post-visit notes submitted for appointment ${appointmentId}`);

    // Queue medication reminders for each prescription item (non-blocking)
    if (notificationService && prescription.length > 0) {
      notificationService
        .queueMedicationReminders(appointment)
        .catch((e) => logger.error(`Failed to queue medication reminders: ${e.message}`));
    }

    // Update Google Calendar events to reflect completed status (non-blocking)
    if (calendarService) {
      calendarService
        .updateCalendarEvents(appointment)
        .catch((e) => logger.error(`Failed to update calendar events after notes: ${e.message}`));
    }

    res.status(200).json({ message: "Notes submitted successfully.", appointment });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/doctor/profile ──────────────────────────────────────────────────
// Doctor views their own profile
exports.getProfile = async (req, res, next) => {
  try {
    const profile = await DoctorProfile.findOne({ userId: req.user.id })
      .populate("userId", "name email phone")
      .lean();

    if (!profile)
      return res.status(404).json({ message: "Doctor profile not found." });

    res.status(200).json({ profile });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/doctor/leave ───────────────────────────────────────────────────
// Doctor marks leave days — triggers conflict handling for existing confirmed appointments
exports.markLeave = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    const { dates } = req.body; // ["YYYY-MM-DD", ...]
    const doctorId = req.user.id;

    const profile = await DoctorProfile.findOne({ userId: doctorId });
    if (!profile)
      return res.status(404).json({ message: "Doctor profile not found." });

    // Merge new leave days (avoid duplicates)
    const merged = [...new Set([...profile.leaveDays, ...dates])];
    profile.leaveDays = merged;
    await profile.save();

    logger.info(`Doctor ${doctorId} marked leave for: ${dates.join(", ")}`);

    // ── Conflict handling ──────────────────────────────────────────────────────
    // Build $or query for each leave date range
    const dateRanges = dates.map((d) => ({
      slotStart: {
        $gte: new Date(`${d}T00:00:00.000Z`),
        $lte: new Date(`${d}T23:59:59.999Z`),
      },
    }));

    const affectedAppointments = await Appointment.find({
      doctorId,
      status: "confirmed",
      $or: dateRanges,
    }).populate("patientId", "name email");

    if (affectedAppointments.length === 0) {
      return res.status(200).json({
        message: "Leave days saved. No confirmed appointments were affected.",
        leaveDays: profile.leaveDays,
      });
    }

    // Cancel each affected appointment and create notifications
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      for (const appt of affectedAppointments) {
        appt.status = "cancelled";
        appt.cancellationReason = "Doctor marked leave for this day";
        await appt.save({ session });

        await AppointmentStatusHistory.create(
          [{
            appointmentId: appt._id,
            fromStatus: "confirmed",
            toStatus: "cancelled",
            reason: "Doctor marked leave for this day",
            changedBy: doctorId,
          }],
          { session }
        );

        // Build notification record inline (outbox pattern)
        // Full email sending handled by notification service in Task 9
        await Notification.create(
          [{
            type: "cancellation",
            recipientId: appt.patientId._id,
            appointmentId: appt._id,
            status: "queued",
            emailPayload: {
              to: appt.patientId.email,
              subject: "Your appointment has been cancelled",
              body: `Dear ${appt.patientId.name}, your appointment on ${appt.slotStart.toDateString()} has been cancelled because the doctor has marked a leave day. Please rebook at your convenience.`,
            },
          }],
          { session }
        );
      }

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    // Delete Google Calendar events for cancelled appointments (non-blocking)
    if (calendarService) {
      for (const appt of affectedAppointments) {
        calendarService
          .deleteCalendarEvents(appt)
          .catch((e) => logger.error(`Calendar delete failed for ${appt._id}: ${e.message}`));
      }
    }

    logger.info(
      `Leave conflict: ${affectedAppointments.length} appointments cancelled for doctor ${doctorId}`
    );

    res.status(200).json({
      message: `Leave days saved. ${affectedAppointments.length} confirmed appointment(s) cancelled and patients notified.`,
      leaveDays: profile.leaveDays,
      cancelledAppointments: affectedAppointments.map((a) => ({
        id: a._id,
        slotStart: a.slotStart,
        patientName: a.patientId.name,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/doctor/leave ─────────────────────────────────────────────────
// Doctor removes leave days (e.g. they changed their mind before any bookings)
exports.removeLeave = async (req, res, next) => {
  try {
    const { dates } = req.body;
    if (!Array.isArray(dates) || dates.length === 0)
      return res.status(400).json({ message: "dates must be a non-empty array." });

    const profile = await DoctorProfile.findOne({ userId: req.user.id });
    if (!profile)
      return res.status(404).json({ message: "Doctor profile not found." });

    profile.leaveDays = profile.leaveDays.filter((d) => !dates.includes(d));
    await profile.save();

    logger.info(`Doctor ${req.user.id} removed leave for: ${dates.join(", ")}`);
    res.status(200).json({ message: "Leave days removed.", leaveDays: profile.leaveDays });
  } catch (err) {
    next(err);
  }
};
