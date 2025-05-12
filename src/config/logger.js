import winston from "winston";
import "winston-daily-rotate-file";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each log level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Create the logger configuration
const loggerConfig = {
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
  ),
  transports: [
    // Console transport
    new winston.transports.Console(),

    // Daily rotate file transport
    new winston.transports.DailyRotateFile({
      filename: "logs/application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),

    // Error log transport
    new winston.transports.DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      level: "error",
    }),
  ],
};

// Create the logger
const logger = winston.createLogger(loggerConfig);

// If we're not in production, log to the console with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

export default logger;

// import winston from "winston";
// import "winston-daily-rotate-file";

// // Define log levels with more granular control
// const levels = {
//   error: 0,
//   warn: 1,
//   info: 2,
//   http: 3,
//   debug: 4,
//   verbose: 5,
//   silly: 6
// };

// // Enhanced colors for better visibility
// const colors = {
//   error: "red",
//   warn: "yellow",
//   info: "green",
//   http: "magenta",
//   debug: "blue",
//   verbose: "cyan",
//   silly: "gray"
// };

// // ... existing code ...

// // Create the logger configuration with enhanced features
// const loggerConfig = {
//   levels,
//   format: winston.format.combine(
//     winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
//     winston.format.errors({ stack: true }), // Add stack traces for errors
//     winston.format.splat(), // Enable string interpolation
//     winston.format.json(), // JSON format for better parsing
//     winston.format.colorize({ all: true }),
//     winston.format.printf((info) => {
//       const { timestamp, level, message, ...meta } = info;
//       return `${timestamp} ${level}: ${message} ${
//         Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
//       }`;
//     })
//   ),
//   transports: [
//     // Console transport with better formatting
//     new winston.transports.Console({
//       level: process.env.LOG_LEVEL || "info",
//       handleExceptions: true,
//       handleRejections: true,
//     }),

//     // Daily rotate file transport with enhanced configuration
//     new winston.transports.DailyRotateFile({
//       filename: "logs/application-%DATE%.log",
//       datePattern: "YYYY-MM-DD",
//       zippedArchive: true,
//       maxSize: "20m",
//       maxFiles: "14d",
//       level: process.env.LOG_LEVEL || "info",
//       handleExceptions: true,
//       handleRejections: true,
//       format: winston.format.combine(
//         winston.format.timestamp(),
//         winston.format.json()
//       ),
//     }),

//     // Error log transport with enhanced configuration
//     new winston.transports.DailyRotateFile({
//       filename: "logs/error-%DATE%.log",
//       datePattern: "YYYY-MM-DD",
//       zippedArchive: true,
//       maxSize: "20m",
//       maxFiles: "30d", // Keep error logs longer
//       level: "error",
//       handleExceptions: true,
//       handleRejections: true,
//       format: winston.format.combine(
//         winston.format.timestamp(),
//         winston.format.json()
//       ),
//     }),
//   ],
//   exitOnError: false, // Don't exit on handled exceptions
// };

// // Create the logger
// const logger = winston.createLogger(loggerConfig);

// // Add unhandled exception and rejection handlers
// logger.exceptions.handle(
//   new winston.transports.DailyRotateFile({
//     filename: "logs/exceptions-%DATE%.log",
//     datePattern: "YYYY-MM-DD",
//     zippedArchive: true,
//     maxSize: "20m",
//     maxFiles: "30d",
//   })
// );

// logger.rejections.handle(
//   new winston.transports.DailyRotateFile({
//     filename: "logs/rejections-%DATE%.log",
//     datePattern: "YYYY-MM-DD",
//     zippedArchive: true,
//     maxSize: "20m",
//     maxFiles: "30d",
//   })
// );

// // Development environment specific configuration
// if (process.env.NODE_ENV !== "production") {
//   logger.add(
//     new winston.transports.Console({
//       format: winston.format.combine(
//         winston.format.colorize(),
//         winston.format.simple()
//       ),
//       level: "debug",
//     })
//   );
// }

// export default logger;
