const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middleware/auth.middleware");
const {
  createDoctor,
  createDoctorValidation,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  updateDoctorValidation,
  deactivateDoctor,
  adminMarkLeave,
  leaveDoctorValidation,
  getAllAppointments,
  getNotificationStatus,
  getAllUsers,
  toggleUserActive,
} = require("../controllers/admin.controller");

// All admin routes require authentication + admin role
router.use(verifyToken, authorizeRoles("admin"));

// ─── Doctor management ────────────────────────────────────────────────────────
router.post("/doctors", createDoctorValidation, createDoctor);
router.get("/doctors", getAllDoctors);
router.get("/doctors/:id", getDoctorById);
router.patch("/doctors/:id", updateDoctorValidation, updateDoctor);
router.delete("/doctors/:id", deactivateDoctor);
router.post("/doctors/:id/leave", leaveDoctorValidation, adminMarkLeave);

// ─── System-wide appointment view ─────────────────────────────────────────────
router.get("/appointments", getAllAppointments);

// ─── Notification status dashboard ───────────────────────────────────────────
router.get("/notifications", getNotificationStatus);

// ─── User management ──────────────────────────────────────────────────────────
router.get("/users", getAllUsers);
router.patch("/users/:id/toggle-active", toggleUserActive);

module.exports = router;
