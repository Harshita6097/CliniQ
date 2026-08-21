const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middleware/auth.middleware");
const {
  getDoctors,
  getSlots,
  holdAppointment,
  holdValidation,
  confirmAppointment,
  confirmValidation,
  cancelAppointmentHandler,
  getMyAppointments,
  getAppointmentById,
} = require("../controllers/appointment.controller");

// All patient routes require authentication + patient role
router.use(verifyToken, authorizeRoles("patient"));

// ─── Doctor discovery ─────────────────────────────────────────────────────────
router.get("/doctors", getDoctors);
router.get("/doctors/:doctorId/slots", getSlots);

// ─── Booking flow ─────────────────────────────────────────────────────────────
router.post("/appointments/hold", holdValidation, holdAppointment);
router.post("/appointments/:id/confirm", confirmValidation, confirmAppointment);
router.delete("/appointments/:id", cancelAppointmentHandler);

// ─── Appointment views ────────────────────────────────────────────────────────
router.get("/appointments", getMyAppointments);
router.get("/appointments/:id", getAppointmentById);

module.exports = router;
