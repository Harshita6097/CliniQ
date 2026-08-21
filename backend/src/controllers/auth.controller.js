const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const logger = require("../utils/logger");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const signToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id, user.role);
  res.status(statusCode).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

// ─── Validation Rules ─────────────────────────────────────────────────────────

exports.registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role")
    .isIn(["patient", "doctor"])
    .withMessage("Role must be patient or doctor — admin accounts are created manually"),
];

exports.loginValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

// ─── Controllers ──────────────────────────────────────────────────────────────

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    const { name, email, password, role, phone } = req.body;

    // passwordHash field triggers the bcrypt pre-save hook in User model
    // No manual duplicate check needed — unique index on email + errorHandler handles 11000
    const user = await User.create({ name, email, passwordHash: password, role, phone });

    logger.info(`New user registered: ${user.email} [${user.role}]`);
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    const { email, password } = req.body;

    // Explicitly select passwordHash since it has select:false on the schema
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: "Invalid email or password." });

    if (!user.isActive)
      return res.status(403).json({ message: "Account is deactivated. Contact admin." });

    logger.info(`User logged in: ${user.email} [${user.role}]`);
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me  — returns current authenticated user
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/me  — update own name / phone
exports.updateMe = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (!name && !phone)
      return res.status(400).json({ message: "Provide at least one field to update: name or phone." });

    const updates = {};
    if (name)  updates.name  = name;
    if (phone) updates.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    logger.info(`User profile updated: ${user.email}`);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Both currentPassword and newPassword are required." });
    if (newPassword.length < 6)
      return res.status(400).json({ message: "New password must be at least 6 characters." });

    const user = await User.findById(req.user.id).select("+passwordHash");
    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ message: "Current password is incorrect." });

    user.passwordHash = newPassword; // pre-save hook will re-hash
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);
    res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    next(err);
  }
};
