const express = require("express");
const router = express.Router();
const {
  register,
  registerValidation,
  login,
  loginValidation,
  getMe,
  updateMe,
  changePassword,
} = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// Public routes
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);

// Protected routes — any authenticated role
router.get("/me", verifyToken, getMe);
router.patch("/me", verifyToken, updateMe);
router.post("/change-password", verifyToken, changePassword);

module.exports = router;
