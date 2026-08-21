const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

// ─── verifyToken ──────────────────────────────────────────────────────────────
// Extracts and verifies the JWT from the Authorization header.
// Attaches decoded payload { id, role } to req.user for downstream use.
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "No token provided." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    logger.warn(`Token verification failed: ${err.message}`);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// ─── authorizeRoles ───────────────────────────────────────────────────────────
// Factory that returns a middleware allowing only the specified roles.
// Usage: authorizeRoles("admin", "doctor")
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn(
        `Unauthorized access attempt by user ${req.user.id} [${req.user.role}] on ${req.originalUrl}`
      );
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(" or ")}.`,
      });
    }
    next();
  };
};

module.exports = { verifyToken, authorizeRoles };
