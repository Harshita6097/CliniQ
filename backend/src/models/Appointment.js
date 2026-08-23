const mongoose = require("mongoose");

const prescriptionItemSchema = new mongoose.Schema(
  {
    medicine: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },   // e.g. "500mg"
    frequency: { type: String, required: true, trim: true }, // e.g. "twice daily"
    durationDays: { type: Number, required: true, min: [1, "Duration must be at least 1 day"] },
    notes: { type: String, default: null },
  },
  { _id: false }
);

const preVisitSummarySchema = new mongoose.Schema(
  {
    urgency: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: null,
    },
    chiefComplaint: { type: String, default: null },
    suggestedQuestions: { type: [String], default: [] },
    generatedAt: { type: Date, default: null },
    isFallback: { type: Boolean, default: false }, // true when LLM failed and template was used
  },
  { _id: false }
);

const postVisitSummarySchema = new mongoose.Schema(
  {
    patientFriendlySummary: { type: String, default: null },
    generatedAt: { type: Date, default: null },
    isFallback: { type: Boolean, default: false },
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slotStart: {
      type: Date,
      required: true,
    },
    slotEnd: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["held", "confirmed", "cancelled", "completed"],
      default: "held",
    },
    // Expiry for the hold — background job releases slots past this time
    holdExpiresAt: {
      type: Date,
      default: null,
    },
    symptomFormText: {
      type: String,
      default: null,
    },
    preVisitSummary: {
      type: preVisitSummarySchema,
      default: null,
    },
    // Doctor fills these after the visit
    postVisitNotes: {
      type: String,
      default: null,
    },
    postVisitSummary: {
      type: postVisitSummarySchema,
      default: null,
    },
    prescription: {
      type: [prescriptionItemSchema],
      default: [],
    },
    // Google Calendar event IDs for update/delete on reschedule/cancellation
    calendarEventId: {
      patient: { type: String, default: null },
      doctor: { type: String, default: null },
    },
    cancellationReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// ─── Critical Index ────────────────────────────────────────────────────────────
// Compound partial unique index: only one held/confirmed appointment per
// (doctorId, slotStart) pair. This is the DB-level double-booking guarantee.
// "cancelled" and "completed" appointments are excluded so the slot can be re-booked.
appointmentSchema.index(
  { doctorId: 1, slotStart: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["held", "confirmed"] } },
    name: "unique_active_slot",
  }
);

// Supporting indexes for common query patterns
appointmentSchema.index({ patientId: 1, status: 1 });
appointmentSchema.index({ doctorId: 1, status: 1 });
appointmentSchema.index({ holdExpiresAt: 1 }); // for hold cleanup job
appointmentSchema.index({ status: 1, slotStart: 1 }); // for medication reminder job

module.exports = mongoose.model("Appointment", appointmentSchema);
