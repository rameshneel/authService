// src/utils/asyncHandler.js
import { safeLogger } from "../config/logger.js";

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      safeLogger.error("Async handler caught error", {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        correlationId: req.correlationId,
      });
      next(err);
    });
  };
};

export { asyncHandler };
