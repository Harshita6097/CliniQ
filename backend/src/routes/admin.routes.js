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
  reactivateDoctor,
  updateDoctorUser,
  adminMarkLeave,
  leaveDoctorValidation,
  getAllAppointments,
  getAdminAppointmentById,
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
router.patch("/doctors/:id/reactivate", reactivateDoctor);
router.patch("/doctors/:id/user", updateDoctorUser);
router.post("/doctors/:id/leave", leaveDoctorValidation, adminMarkLeave);

// ─── System-wide appointment view ─────────────────────────────────────────────
router.get("/appointments", getAllAppointments);
router.get("/appointments/:id", getAdminAppointmentById);

// ─── Notification status dashboard ───────────────────────────────────────────
router.get("/notifications", getNotificationStatus);

// ─── User management ──────────────────────────────────────────────────────────
router.get("/users", getAllUsers);
router.patch("/users/:id/toggle-active", toggleUserActive);

module.exports = router;
