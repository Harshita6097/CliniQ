const mongoose = require("mongoose");
const { body, param, validationResult } = require("express-validator");
const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const Appointment = require("../models/Appointment");
const AppointmentStatusHistory = require("../models/AppointmentStatusHistory");
const Notification = require("../models/Notification");
const logger = require("../utils/logger");

let calendarService;
try { calendarService = require("../services/calendar.service"); } catch (_) {}

// ─── Validation ───────────────────────────────────────────────────────────────

exports.createDoctorValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail({ gmail_remove_dots: false }),
  body("password").isLength({ min: 6, max: 72 }).withMessage("Password must be 6–72 characters"),
  body("specialization").trim().notEmpty().withMessage("Specialization is required"),
  body("slotDurationMins").isInt({ min: 5 }).withMessage("Slot duration must be at least 5 minutes"),
  body("consultationFee").optional().isFloat({ min: 0 }).withMessage("Consultation fee cannot be negative"),
  body("workingHours").isArray({ min: 1 }).withMessage("workingHours must be a non-empty array"),
  body("workingHours.*.day")
    .isIn(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])
    .withMessage("Invalid day in workingHours"),
  body("workingHours.*.start").matches(/^\d{2}:\d{2}$/).withMessage("workingHours start must be HH:mm"),
  body("workingHours.*.end").matches(/^\d{2}:\d{2}$/).withMessage("workingHours end must be HH:mm"),
  body("workingHours").custom((wh) => {
    for (const entry of wh) {
      if (entry.start >= entry.end)
        throw new Error(`Working hours for ${entry.day}: start time must be before end time.`);
    }
    const days = wh.map(e => e.day);
    if (new Set(days).size !== days.length)
      throw new Error("Duplicate days found in workingHours. Each day must appear only once.");
    return true;
  }),
];

exports.updateDoctorValidation = [
  param("id").isMongoId().withMessage("Valid doctor user id is required"),
  body("specialization").optional().trim().notEmpty(),
  body("slotDurationMins").optional().isInt({ min: 5 }),
  body("workingHours").optional().isArray({ min: 1 }),
  body("consultationFee").optional().isFloat({ min: 0 }).withMessage("Consultation fee cannot be negative"),
  body("workingHours").optional().custom((wh) => {
    if (!Array.isArray(wh)) return true;
    for (const entry of wh) {
      if (entry.start >= entry.end)
        throw new Error(`Working hours for ${entry.day}: start time must be before end time.`);
    }
    const days = wh.map(e => e.day);
    if (new Set(days).size !== days.length)
      throw new Error("Duplicate days found in workingHours.");
    return true;
  }),
];

exports.leaveDoctorValidation = [
  param("id").isMongoId().withMessage("Valid doctor user id is required"),
  body("dates").isArray({ min: 1 }).withMessage("dates must be a non-empty array of YYYY-MM-DD strings"),
  body("dates.*")
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("Each date must be in YYYY-MM-DD format")
    .custom((val) => {
      const today = new Date(); today.setUTCHours(0, 0, 0, 0);
      if (new Date(val) < today) throw new Error(`Cannot mark leave for a past date: ${val}`);
      return true;
    }),
];

// ─── Helper: cancel appointments + notify patients ────────────────────────────
// Reused by both admin leave management and doctor leave (same logic, admin-triggered)
const cancelAppointmentsOnLeave = async (doctorId, dates, changedBy, session) => {
  const dateRanges = dates.map((d) => ({
    slotStart: {
      $gte: new Date(`${d}T00:00:00.000Z`),
      $lte: new Date(`${d}T23:59:59.999Z`),
    },
  }));

  const affected = await Appointment.find({
    doctorId,
    status: "confirmed",
    $or: dateRanges,
  })
    .populate("patientId", "name email")
    .session(session);

  for (const appt of affected) {
    appt.status = "cancelled";
    appt.cancellationReason = "Doctor leave day set by admin";
    await appt.save({ session });

    await AppointmentStatusHistory.create(
      [{
        appointmentId: appt._id,
        fromStatus: "confirmed",
        toStatus: "cancelled",
        reason: "Doctor leave day set by admin",
        changedBy,
      }],
      { session }
    );

    await Notification.create(
      [{
        type: "cancellation",
        recipientId: appt.patientId._id,
        appointmentId: appt._id,
        status: "queued",
        emailPayload: {
          to: appt.patientId.email,
          subject: "Your appointment has been cancelled",
          body: `Dear ${appt.patientId.name}, your appointment on ${appt.slotStart.toDateString()} has been cancelled due to the doctor's leave. Please rebook at your convenience.`,
        },
      }],
      { session }
    );
  }

  return affected;
};

// ─── POST /api/admin/doctors ──────────────────────────────────────────────────
// Create a doctor user account + profile in one atomic operation
exports.createDoctor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    const {
      name, email, password, phone,
      specialization, workingHours, slotDurationMins,
      consultationFee, qualifications, bio,
    } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const [user] = await User.create(
        [{ name, email, passwordHash: password, role: "doctor", phone }],
        { session }
      );

      const [profile] = await DoctorProfile.create(
        [{
          userId: user._id,
          specialization,
          workingHours,
          slotDurationMins,
          consultationFee: consultationFee || 0,
          qualifications: qualifications || null,
          bio: bio || null,
        }],
        { session }
      );

      await session.commitTransaction();
      logger.info(`Admin created doctor: ${email}`);
      res.status(201).json({ message: "Doctor created.", user, profile });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/doctors ───────────────────────────────────────────────────
// List all doctors with their profiles
exports.getAllDoctors = async (req, res, next) => {
  try {
    const profiles = await DoctorProfile.find()
      .populate("userId", "name email phone isActive")
      .lean();
    res.status(200).json({ doctors: profiles });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/doctors/:id ───────────────────────────────────────────────
exports.getDoctorById = async (req, res, next) => {
  try {
    const profile = await DoctorProfile.findOne({ userId: req.params.id })
      .populate("userId", "name email phone isActive")
      .lean();
    if (!profile)
      return res.status(404).json({ message: "Doctor not found." });
    res.status(200).json({ profile });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/admin/doctors/:id ────────────────────────────────────────────
// Update doctor profile fields (specialization, working hours, slot duration etc.)
exports.updateDoctor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    const allowedFields = [
      "specialization", "workingHours", "slotDurationMins",
      "consultationFee", "qualifications", "bio",
    ];
    const updates = {};
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const profile = await DoctorProfile.findOneAndUpdate(
      { userId: req.params.id },
      updates,
      { new: true, runValidators: true }
    ).populate("userId", "name email");

    if (!profile)
      return res.status(404).json({ message: "Doctor profile not found." });

    logger.info(`Admin updated doctor profile: ${req.params.id}`);
    res.status(200).json({ message: "Doctor profile updated.", profile });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/admin/doctors/:id ───────────────────────────────────────────
// Deactivate a doctor account (soft delete — preserves appointment history)
exports.deactivateDoctor = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "doctor" },
      { isActive: false },
      { new: true }
    );
    if (!user)
      return res.status(404).json({ message: "Doctor not found." });

    logger.info(`Admin deactivated doctor: ${req.params.id}`);
    res.status(200).json({ message: "Doctor account deactivated." });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/admin/doctors/:id/reactivate ─────────────────────────────────
// Reactivate a previously deactivated doctor account
exports.reactivateDoctor = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "doctor" },
      { isActive: true },
      { new: true }
    );
    if (!user)
      return res.status(404).json({ message: "Doctor not found." });

    logger.info(`Admin reactivated doctor: ${req.params.id}`);
    res.status(200).json({ message: "Doctor account reactivated." });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/admin/doctors/:id/user ───────────────────────────────────────
// Update a doctor's name and/or email (User record, not profile)
exports.updateDoctorUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name && !email)
      return res.status(400).json({ message: "Provide at least one field: name or email." });

    const updates = {};
    if (name)  updates.name  = name;
    if (email) {
      // Validate email format before saving
      if (!/^\S+@\S+\.\S+$/.test(email))
        return res.status(400).json({ message: "Invalid email format." });
      updates.email = email.toLowerCase().trim();
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "doctor" },
      updates,
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!user)
      return res.status(404).json({ message: "Doctor not found." });

    logger.info(`Admin updated doctor user record: ${req.params.id}`);
    res.status(200).json({ message: "Doctor user record updated.", user });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/admin/doctors/:id/leave ───────────────────────────────────────
// Admin marks leave days for a doctor — same conflict handling as doctor self-service
exports.adminMarkLeave = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    const { dates } = req.body;
    const doctorId = req.params.id;

    const profile = await DoctorProfile.findOne({ userId: doctorId });
    if (!profile)
      return res.status(404).json({ message: "Doctor profile not found." });

    const session = await mongoose.startSession();
    session.startTransaction();
    let affected = [];
    try {
      profile.leaveDays = [...new Set([...profile.leaveDays, ...dates])];
      await profile.save({ session });
      affected = await cancelAppointmentsOnLeave(doctorId, dates, req.user.id, session);
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    // Delete calendar events non-blocking
    if (calendarService) {
      for (const appt of affected) {
        calendarService
          .deleteCalendarEvents(appt)
          .catch((e) => logger.error(`Calendar delete failed for ${appt._id}: ${e.message}`));
      }
    }

    logger.info(`Admin marked leave for doctor ${doctorId}: ${dates.join(", ")} — ${affected.length} appointments cancelled`);
    res.status(200).json({
      message: `Leave saved. ${affected.length} appointment(s) cancelled.`,
      leaveDays: profile.leaveDays,
      cancelledCount: affected.length,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/appointments ─────────────────────────────────────────────
// System-wide appointment view with optional filters
exports.getAllAppointments = async (req, res, next) => {
  try {
    const { status, doctorId, patientId, from, to } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (doctorId) filter.doctorId = doctorId;
    if (patientId) filter.patientId = patientId;
    if (from || to) {
      filter.slotStart = {};
      if (from) filter.slotStart.$gte = new Date(from);
      if (to)   filter.slotStart.$lte = new Date(to);
    }

    const appointments = await Appointment.find(filter)
      .populate("patientId", "name email")
      .populate("doctorId", "name email")
      .sort({ slotStart: -1 })
      .lean();

    res.status(200).json({ total: appointments.length, appointments });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/notifications ────────────────────────────────────────────
// Notification status dashboard — queued / sent / failed counts + recent entries
exports.getNotificationStatus = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [notifications, counts] = await Promise.all([
      Notification.find(filter)
        .populate("recipientId", "name email")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      Notification.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const summary = { queued: 0, sent: 0, failed: 0 };
    counts.forEach(({ _id, count }) => { summary[_id] = count; });

    res.status(200).json({ summary, notifications });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
// List all users (patients + doctors) — for admin oversight
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter).select("-passwordHash").lean();
    res.status(200).json({ total: users.length, users });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/admin/users/:id/toggle-active ────────────────────────────────
// Activate or deactivate any user account
exports.toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "User not found." });

    user.isActive = !user.isActive;
    await user.save();

    logger.info(`Admin toggled user ${req.params.id} isActive → ${user.isActive}`);
    res.status(200).json({
      message: `User ${user.isActive ? "activated" : "deactivated"}.`,
      isActive: user.isActive,
    });
  } catch (err) {
    next(err);
  }
};
