const logger = require("../utils/logger");

// Centralised error handler — must be registered LAST in Express middleware chain
const errorHandler = (err, req, res, next) => {
  // Mongoose duplicate key (e.g. unique index violation on slot hold)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(", ");
    logger.warn(`Duplicate key error on [${field}]: ${JSON.stringify(err.keyValue)}`);
    return res.status(409).json({ message: "Slot no longer available. Please select another slot." });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    logger.warn(`Validation error: ${messages.join(", ")}`);
    return res.status(400).json({ message: messages.join(", ") });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    logger.warn(`JWT error: ${err.message}`);
    return res.status(401).json({ message: "Invalid or expired token." });
  }

  // Default — unexpected server error
  const statusCode = err.statusCode || 500;
  logger.error(err);
  res.status(statusCode).json({
    message: err.message || "Internal server error.",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
