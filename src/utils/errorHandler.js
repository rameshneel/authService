// src/middleware/errorHandler.js
import { ApiError } from "./ApiError.js";
import { safeLogger } from "../config/logger.js";
import { status as grpcStatus } from "@grpc/grpc-js";

// gRPC error code to HTTP status
const grpcErrorToHttpStatus = (grpcCode) => {
  switch (grpcCode) {
    case grpcStatus.DEADLINE_EXCEEDED:
      return 504;
    case grpcStatus.UNAVAILABLE:
      return 503;
    case grpcStatus.INVALID_ARGUMENT:
      return 400;
    case grpcStatus.NOT_FOUND:
      return 404;
    case grpcStatus.INTERNAL:
      return 500;
    default:
      return 500;
  }
};

// Map known non-HTTP errors to HTTP status
const mapNonHttpErrorToStatus = (error) => {
  const msg = error.message.toLowerCase();

  if (msg.includes("connection refused") || msg.includes("timeout")) {
    return 503;
  }
  if (msg.includes("not found")) {
    return 404;
  }
  if (msg.includes("validation")) {
    return 400;
  }
  return 500;
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(err instanceof ApiError)) {
    let statusCode = 500;
    let message = err.message || "Internal Server Error";
    let details = [];

    // gRPC error
    if (err.code && typeof err.code === "number") {
      statusCode = grpcErrorToHttpStatus(err.code);
      message ||= "gRPC Error";
      details = [err.message, err.details].filter(Boolean);
    }
    // RabbitMQ/DB/Other
    else {
      statusCode = mapNonHttpErrorToStatus(err);
    }

    error = new ApiError(statusCode, message, details, err.stack);
  }

  // Log the error
  safeLogger.error("Global Error", {
    message: error.message,
    statusCode: error.statusCode,
    details: error.details,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    correlationId: req.correlationId || "unknown",
    user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
  });

  // Respond
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.details,
    ...(process.env.NODE_ENV === "production" ? {} : { stack: error.stack }),
  });
};

export { errorHandler };
