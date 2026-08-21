require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./src/config/db");
const errorHandler = require("./src/middleware/errorHandler.middleware");
const logger = require("./src/utils/logger");

const app = express();

// ─── Connect Database ──────────────────────────────────────────────────────────
connectDB();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { message: "Too many requests, please try again later." },
  })
);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── Request Logger ────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.originalUrl}`);
  next();
});

// ─── Health / Uptime Ping Endpoint ────────────────────────────────────────────
// Used by external cron ping (e.g. cron-job.org) to keep free-tier host alive
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API Routes (mounted as tasks are completed) ──────────────────────────────
app.use("/api/auth",     require("./src/routes/auth.routes"));
app.use("/api/patient",  require("./src/routes/patient.routes"));
app.use("/api/doctor",   require("./src/routes/doctor.routes"));
app.use("/api/admin",    require("./src/routes/admin.routes"));
// app.use("/api/calendar", require("./src/routes/calendar.routes"));   // Task 10

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// ─── Centralised Error Handler (must be last) ─────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});

module.exports = app; // exported for testing
