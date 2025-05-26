// logger.js
import winston from "winston";
import fs from "fs";

// Ensure logs folder exists
const logDir = "logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define colors for development
winston.addColors({
  error: "red",
  warn: "yellow",
  info: "green",
  debug: "blue",
});

// Clean timestamped format — no object wrapping
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) =>
    stack
      ? `${timestamp} ${level}: ${message}\n${stack}`
      : `${timestamp} ${level}: ${message}`
  )
);

// Create logger
const logger = winston.createLogger({
  levels,
  format: logFormat,
  transports: [
    new winston.transports.File({ filename: "logs/app.log", level: "debug" }),
  ],
});

// Add colored console output in development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        logFormat
      ),
    })
  );
}

// Helper exports
export const logInfo = (msg) => logger.info(msg);
export const logError = (msg, err) =>
  logger.error(`${msg}${err ? ` - ${err.message}` : ""}`, err);
export const logDebug = (msg) => logger.debug(msg);
export const logWarn = (msg) => logger.warn(msg);

export default logger;
