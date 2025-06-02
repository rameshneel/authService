// src/utils/ApiError.js
class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    details = [],
    stack = ""
  ) {
    if (
      typeof statusCode !== "number" ||
      statusCode < 100 ||
      statusCode > 599
    ) {
      throw new Error("Invalid HTTP status code");
    }
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.details = details;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
