const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middleware/auth.middleware");
const {
  getDoctorAppointments,
  getDoctorAppointmentById,
  submitNotes,
  notesValidation,
  getProfile,
  markLeave,
  leaveValidation,
  removeLeave,
} = require("../controllers/doctor.controller");

// All doctor routes require authentication + doctor role
router.use(verifyToken, authorizeRoles("doctor"));

// ─── Profile ──────────────────────────────────────────────────────────────────
router.get("/profile", getProfile);

// ─── Appointments ─────────────────────────────────────────────────────────────
router.get("/appointments", getDoctorAppointments);
router.get("/appointments/:id", getDoctorAppointmentById);
router.post("/appointments/:id/notes", notesValidation, submitNotes);

// ─── Leave management ─────────────────────────────────────────────────────────
router.post("/leave", leaveValidation, markLeave);
router.delete("/leave", removeLeave);

module.exports = router;
