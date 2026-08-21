const { body, param, query, validationResult } = require("express-validator");
const DoctorProfile = require("../models/DoctorProfile");
const Appointment = require("../models/Appointment");
const AppointmentStatusHistory = require("../models/AppointmentStatusHistory");
const User = require("../models/User");
const { getAvailableSlots, holdSlot, confirmSlot, cancelAppointment } = require("../services/slot.service");
const logger = require("../utils/logger");

// LLM service — imported lazily so booking flow continues even if LLM module fails to load
let llmService;
try { llmService = require("../services/llm.service"); } catch (_) {}

// Notification service — same pattern
let notificationService;
try { notificationService = require("../services/notification.service"); } catch (_) {}

// ─── Validation ───────────────────────────────────────────────────────────────

exports.holdValidation = [
  body("doctorId").isMongoId().withMessage("Valid doctorId is required"),
  body("slotStart").isISO8601().withMessage("Valid slotStart (ISO8601) is required"),
  body("slotEnd").isISO8601().withMessage("Valid slotEnd (ISO8601) is required"),
];

exports.confirmValidation = [
  param("id").isMongoId().withMessage("Valid appointment id is required"),
  body("symptomFormText").trim().notEmpty().withMessage("Symptom description is required"),
];

// ─── GET /api/patient/doctors ─────────────────────────────────────────────────
// Search doctors by specialization (optional query param)
exports.getDoctors = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.specialization)
      filter.specialization = { $regex: req.query.specialization, $options: "i" };

    const profiles = await DoctorProfile.find(filter)
      .populate("userId", "name email phone")
      .lean();

    res.status(200).json({ doctors: profiles });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/patient/doctors/:doctorId/slots ─────────────────────────────────
// Returns available slots for a doctor on a given date
exports.getSlots = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query; // "YYYY-MM-DD"

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      return res.status(400).json({ message: "Query param 'date' is required in YYYY-MM-DD format." });

    const slots = await getAvailableSlots(doctorId, date);
    res.status(200).json({ date, slots });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/patient/appointments/hold ─────────────────────────────────────
// Step 1 of booking: creates a held appointment (5-min window)
exports.holdAppointment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    const { doctorId, slotStart, slotEnd } = req.body;
    const patientId = req.user.id;

    // Verify doctor exists
    const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
    if (!doctorProfile)
      return res.status(404).json({ message: "Doctor not found." });

    const appointment = await holdSlot(patientId, doctorId, new Date(slotStart), new Date(slotEnd));

    res.status(201).json({
      message: "Slot held. Complete the symptom form within the hold window.",
      appointment: {
        id: appointment._id,
        slotStart: appointment.slotStart,
        slotEnd: appointment.slotEnd,
        holdExpiresAt: appointment.holdExpiresAt,
        status: appointment.status,
      },
    });
  } catch (err) {
    next(err); // 11000 duplicate key → errorHandler returns "Slot no longer available"
  }
};

// ─── POST /api/patient/appointments/:id/confirm ───────────────────────────────
// Step 2: patient submits symptom form → LLM generates pre-visit summary → confirmed
exports.confirmAppointment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    const { symptomFormText } = req.body;
    const appointmentId = req.params.id;
    const patientId = req.user.id;

    // Generate pre-visit summary via LLM (non-blocking — fallback on failure)
    let preVisitSummary = null;
    if (llmService) {
      preVisitSummary = await llmService.generatePreVisitSummary(symptomFormText);
    }

    const appointment = await confirmSlot(appointmentId, patientId, symptomFormText, preVisitSummary);

    // Queue confirmation notification (non-blocking)
    if (notificationService) {
      notificationService.queueConfirmationNotification(appointment).catch((e) =>
        logger.error(`Failed to queue confirmation notification: ${e.message}`)
      );
    }

    res.status(200).json({ message: "Appointment confirmed.", appointment });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/patient/appointments/:id ─────────────────────────────────────
// Patient cancels their own appointment
exports.cancelAppointmentHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    const { reason } = req.body;
    const appointment = await cancelAppointment(req.params.id, req.user.id, reason);

    // Queue cancellation notification (non-blocking)
    if (notificationService) {
      notificationService.queueCancellationNotification(appointment).catch((e) =>
        logger.error(`Failed to queue cancellation notification: ${e.message}`)
      );
    }

    res.status(200).json({ message: "Appointment cancelled.", appointment });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/patient/appointments ───────────────────────────────────────────
// Patient views their own appointments
exports.getMyAppointments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { patientId: req.user.id };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate("doctorId", "name email")
      .sort({ slotStart: 1 })
      .lean();

    res.status(200).json({ appointments });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/patient/appointments/:id ───────────────────────────────────────
// Patient views a single appointment detail (includes summaries)
exports.getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patientId: req.user.id,
    })
      .populate("doctorId", "name email")
      .lean();

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found." });

    const history = await AppointmentStatusHistory.find({
      appointmentId: req.params.id,
    }).sort({ timestamp: 1 }).lean();

    res.status(200).json({ appointment, history });
  } catch (err) {
    next(err);
  }
};
