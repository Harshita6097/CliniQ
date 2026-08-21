const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const AppointmentStatusHistory = require("../models/AppointmentStatusHistory");
const DoctorProfile = require("../models/DoctorProfile");
const { generateSlotsForDate } = require("../utils/slotGenerator");
const logger = require("../utils/logger");

/**
 * Returns available (unbooked) slots for a doctor on a given date.
 * Filters out slots already held or confirmed.
 */
const getAvailableSlots = async (doctorId, date) => {
  const profile = await DoctorProfile.findOne({ userId: doctorId });
  if (!profile) throw Object.assign(new Error("Doctor profile not found."), { statusCode: 404 });

  // Block slots on leave days
  if (profile.leaveDays.includes(date)) return [];

  const allSlots = generateSlotsForDate(date, profile.workingHours, profile.slotDurationMins);
  if (!allSlots.length) return [];

  // Fetch all active (held/confirmed) appointments for this doctor on this date
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd   = new Date(`${date}T23:59:59.999Z`);

  const booked = await Appointment.find({
    doctorId,
    slotStart: { $gte: dayStart, $lte: dayEnd },
    status: { $in: ["held", "confirmed"] },
  }).select("slotStart");

  const bookedTimes = new Set(booked.map((a) => a.slotStart.toISOString()));

  return allSlots.filter((s) => !bookedTimes.has(s.slotStart.toISOString()));
};

/**
 * Creates a held appointment inside a MongoDB transaction.
 * The compound partial unique index on (doctorId, slotStart) for held/confirmed
 * appointments guarantees only one transaction succeeds on a race condition.
 *
 * @returns {Appointment} the newly created held appointment
 * @throws  duplicate key error (code 11000) if slot was taken concurrently
 */
const holdSlot = async (patientId, doctorId, slotStart, slotEnd) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const holdExpiresAt = new Date(
      Date.now() + (Number(process.env.HOLD_DURATION_MINUTES) || 5) * 60 * 1000
    );

    const [appointment] = await Appointment.create(
      [{ patientId, doctorId, slotStart, slotEnd, status: "held", holdExpiresAt }],
      { session }
    );

    await AppointmentStatusHistory.create(
      [{ appointmentId: appointment._id, fromStatus: null, toStatus: "held", reason: "Slot held by patient" }],
      { session }
    );

    await session.commitTransaction();
    logger.info(`Slot held: appointment ${appointment._id} for patient ${patientId}`);
    return appointment;
  } catch (err) {
    await session.abortTransaction();
    throw err; // 11000 duplicate key bubbles up to errorHandler → "Slot no longer available"
  } finally {
    session.endSession();
  }
};

/**
 * Confirms a held appointment after symptom form submission + LLM summary.
 * Moves status held → confirmed and clears holdExpiresAt.
 */
const confirmSlot = async (appointmentId, patientId, symptomFormText, preVisitSummary) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: appointmentId, patientId, status: "held" },
      {
        status: "confirmed",
        holdExpiresAt: null,
        symptomFormText,
        preVisitSummary,
      },
      { new: true, session }
    );

    if (!appointment) {
      await session.abortTransaction();
      throw Object.assign(
        new Error("Appointment not found, already expired, or not in held status."),
        { statusCode: 404 }
      );
    }

    await AppointmentStatusHistory.create(
      [{ appointmentId, fromStatus: "held", toStatus: "confirmed", reason: "Symptom form submitted" }],
      { session }
    );

    await session.commitTransaction();
    logger.info(`Appointment confirmed: ${appointmentId}`);
    return appointment;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Cancels a confirmed appointment by the patient.
 */
const cancelAppointment = async (appointmentId, patientId, reason = "Cancelled by patient") => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch first to capture the pre-cancel status, then update
    const existing = await Appointment.findOne(
      { _id: appointmentId, patientId, status: { $in: ["held", "confirmed"] } },
      null,
      { session }
    );

    if (!existing) {
      await session.abortTransaction();
      throw Object.assign(new Error("Appointment not found or cannot be cancelled."), { statusCode: 404 });
    }

    const fromStatus = existing.status; // captured before update

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: "cancelled", cancellationReason: reason },
      { new: true, session }
    );

    await AppointmentStatusHistory.create(
      [{ appointmentId, fromStatus, toStatus: "cancelled", reason, changedBy: patientId }],
      { session }
    );

    await session.commitTransaction();
    logger.info(`Appointment cancelled: ${appointmentId} — ${reason}`);
    return appointment;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

module.exports = { getAvailableSlots, holdSlot, confirmSlot, cancelAppointment };
