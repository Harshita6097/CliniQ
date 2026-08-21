const mongoose = require("mongoose");

// Working hours for a single day e.g. { day: "Monday", start: "09:00", end: "17:00" }
const workingHoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true,
    },
    start: { type: String, required: true }, // "HH:mm" 24-hour format
    end: { type: String, required: true },   // "HH:mm" 24-hour format
  },
  { _id: false }
);

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one profile per doctor user
    },
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      trim: true,
    },
    qualifications: {
      type: String,
      trim: true,
      default: null,
    },
    bio: {
      type: String,
      trim: true,
      default: null,
    },
    workingHours: {
      type: [workingHoursSchema],
      default: [],
    },
    slotDurationMins: {
      type: Number,
      required: [true, "Slot duration is required"],
      min: [5, "Slot duration must be at least 5 minutes"],
      default: 30,
    },
    // Array of ISO date strings "YYYY-MM-DD" marking leave days
    leaveDays: {
      type: [String],
      default: [],
    },
    consultationFee: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for fast doctor search by specialization
doctorProfileSchema.index({ specialization: 1 });

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);
