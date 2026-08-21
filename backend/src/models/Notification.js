const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["confirmation", "reminder", "cancellation", "medication_reminder"],
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null, // null for medication reminders not tied to a specific appointment
    },
    // Outbox pattern — every notification is written here first, then sent async
    status: {
      type: String,
      enum: ["queued", "sent", "failed"],
      default: "queued",
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 5,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    // Next retry time — calculated with exponential backoff
    nextRetryAt: {
      type: Date,
      default: null,
    },
    // Email payload stored so retries don't need to recompute it
    emailPayload: {
      to: { type: String, required: true },
      subject: { type: String, required: true },
      body: { type: String, required: true },
    },
    errorMessage: {
      type: String,
      default: null, // stores last failure reason for admin visibility
    },
  },
  { timestamps: true }
);

// Indexes for the notification retry job
notificationSchema.index({ status: 1, nextRetryAt: 1 });
notificationSchema.index({ recipientId: 1, status: 1 });
notificationSchema.index({ appointmentId: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
