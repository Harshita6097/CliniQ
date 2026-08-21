const mongoose = require("mongoose");

// Immutable audit trail — records every status transition on an appointment.
// We never overwrite the status field history; we always append a new entry here.
const appointmentStatusHistorySchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    fromStatus: {
      type: String,
      enum: ["held", "confirmed", "cancelled", "completed", null],
      default: null, // null means this is the initial creation entry
    },
    toStatus: {
      type: String,
      enum: ["held", "confirmed", "cancelled", "completed"],
      required: true,
    },
    reason: {
      type: String,
      default: null, // e.g. "Doctor marked leave", "Patient cancelled", "Hold expired"
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for system-triggered changes (cron jobs)
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // No updatedAt needed — history entries are write-once
    timestamps: { createdAt: "timestamp", updatedAt: false },
  }
);

// Fast lookup of full history for a given appointment
appointmentStatusHistorySchema.index({ appointmentId: 1, timestamp: 1 });

module.exports = mongoose.model("AppointmentStatusHistory", appointmentStatusHistorySchema);
