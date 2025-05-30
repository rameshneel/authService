// src/utils/ApiResponse.js
class ApiResponse {
  constructor(statusCode, data, message = "Success", details = []) {
    if (
      typeof statusCode !== "number" ||
      statusCode < 100 ||
      statusCode > 599
    ) {
      throw new Error("Invalid HTTP status code");
    }
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    this.details = details.length ? details : undefined;
  }
}

export { ApiResponse };
