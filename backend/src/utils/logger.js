const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");

const logDir = path.join(__dirname, "../../logs");

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Console — colourised in dev, plain in prod
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true }),
        logFormat
      ),
    }),

    // Daily rotating file for all info+ logs
    new DailyRotateFile({
      dirname: logDir,
      filename: "app-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      level: "info",
    }),

    // Separate file for errors only
    new DailyRotateFile({
      dirname: logDir,
      filename: "error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "30d",
      level: "error",
    }),
  ],
});

module.exports = logger;
