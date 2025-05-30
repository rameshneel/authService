import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../../config/env.js";
import { safeLogger } from "../../config/logger.js";
import { ApiError } from "../../utils/ApiError.js";
import * as authService from "../services/authService.js";
import { getCorrelationId } from "../../config/requestContext.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, "../proto/auth.proto");

// Load proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const authPackage = grpcObject.authPackage;

// Initialize gRPC server
const server = new grpc.Server();

// Map ApiError to gRPC status codes
const mapToGrpcError = (error) => {
  let status = grpc.status.INTERNAL;
  let message = "Internal Server Error";
  let details = [];

  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 400:
        status = grpc.status.INVALID_ARGUMENT;
        break;
      case 401:
        status = grpc.status.UNAUTHENTICATED;
        break;
      case 404:
        status = grpc.status.NOT_FOUND;
        break;
      case 503:
        status = grpc.status.UNAVAILABLE;
        break;
      default:
        status = grpc.status.INTERNAL;
    }
    message = error.message;
    details = error.details;
  } else {
    message = error.message || "Unknown error";
    details = [error.message];
  }

  return new grpc.statusBuilder()
    .withCode(status)
    .withDetails(
      JSON.stringify({ message, details, correlationId: getCorrelationId() })
    )
    .build();
};

// Auth service implementation
const authServiceImpl = {
  Login: async (call, callback) => {
    const { email, password } = call.request;
    const correlationId =
      call.metadata.get("correlationId")[0] || getCorrelationId();

    try {
      safeLogger.info("Processing Login request", { email, correlationId });
      if (!email || !password) {
        throw new ApiError(400, "Validation Error", [
          "Email and password required",
        ]);
      }

      const { token, userId } = await authService.login({ email, password });
      safeLogger.info("Login successful", { userId, correlationId });
      callback(null, { token, userId });
    } catch (error) {
      const grpcError = mapToGrpcError(error);
      safeLogger.error("Login error", {
        message: error.message,
        stack: error.stack,
        email,
        correlationId,
      });
      callback(grpcError);
    }
  },

  Register: async (call, callback) => {
    const { email, password, name } = call.request;
    const correlationId =
      call.metadata.get("correlationId")[0] || getCorrelationId();

    try {
      safeLogger.info("Processing Register request", { email, correlationId });
      if (!email || !password || !name) {
        throw new ApiError(400, "Validation Error", [
          "Email, password, and name required",
        ]);
      }

      const userId = await authService.register({ email, password, name });
      safeLogger.info("Registration successful", { userId, correlationId });
      callback(null, { userId });
    } catch (error) {
      const grpcError = mapToGrpcError(error);
      safeLogger.error("Register error", {
        message: error.message,
        stack: error.stack,
        email,
        correlationId,
      });
      callback(grpcError);
    }
  },

  ValidateToken: async (call, callback) => {
    const { token } = call.request;
    const correlationId =
      call.metadata.get("correlationId")[0] || getCorrelationId();

    try {
      safeLogger.info("Processing ValidateToken request", { correlationId });
      if (!token) {
        throw new ApiError(400, "Validation Error", ["Token required"]);
      }

      const { valid, userId } = await authService.validateToken(token);
      safeLogger.info("Token validation completed", {
        valid,
        userId,
        correlationId,
      });
      callback(null, { valid, userId });
    } catch (error) {
      const grpcError = mapToGrpcError(error);
      safeLogger.error("ValidateToken error", {
        message: error.message,
        stack: error.stack,
        correlationId,
      });
      callback(grpcError);
    }
  },
};

// Add service to server
server.addService(authPackage.AuthService.service, authServiceImpl);

// Start server
export async function startAuthGrpcServer() {
  const address = `${env.GRPC_AUTH_SERVICE_HOST}:${env.GRPC_AUTH_SERVICE_PORT}`;
  const correlationId = getCorrelationId();

  return new Promise((resolve, reject) => {
    server.bindAsync(
      address,
      grpc.ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          safeLogger.error("Failed to bind auth gRPC server", {
            message: error.message,
            stack: error.stack,
            address,
            correlationId,
          });
          reject(
            new ApiError(500, "Failed to bind gRPC server", [error.message])
          );
          return;
        }
        server.start();
        safeLogger.info(`Auth gRPC server running at ${address}`, {
          port,
          correlationId,
        });
        resolve();
      }
    );
  });
}

// Stop server
export async function stopAuthGrpcServer() {
  const correlationId = getCorrelationId();

  return new Promise((resolve, reject) => {
    server.tryShutdown((error) => {
      if (error) {
        safeLogger.error("Error during auth gRPC server shutdown", {
          message: error.message,
          stack: error.stack,
          correlationId,
        });
        server.forceShutdown();
        safeLogger.info("Auth gRPC server force stopped", { correlationId });
        reject(
          new ApiError(500, "Failed to shut down gRPC server", [error.message])
        );
      } else {
        safeLogger.info("Auth gRPC server stopped", { correlationId });
        resolve();
      }
    });
  });
}

export { server };
