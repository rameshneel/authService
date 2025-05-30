// src/grpc/index.js
import { safeLogger, logger } from "../config/logger.js";
import {
  startAuthGrpcServer,
  stopAuthGrpcServer,
} from "./server/auth.server.js";
import { checkUserServiceHealth } from "./client/userClient.js";
import { ApiError } from "../utils/ApiError.js";
import asyncRetry from "async-retry";

// Initialize gRPC services
async function initializeGrpcServices() {
  const correlationId = addCorrelationId({}, {}, () => {}).correlationId; // Generate correlation ID for startup

  try {
    safeLogger.info("Initializing gRPC services", { correlationId });

    // Check user service health with retry
    await asyncRetry(
      async () => {
        await checkUserServiceHealth();
        safeLogger.info("Successfully connected to UserService", {
          correlationId,
        });
      },
      {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 5000,
        onRetry: (error, attempt) => {
          logError(
            `Retry attempt ${attempt} for UserService health check`,
            error,
            { correlationId }
          );
        },
      }
    );

    // Start auth gRPC server
    await startAuthGrpcServer();
    safeLogger.info("Auth gRPC server initialized", { correlationId });
  } catch (error) {
    const apiError =
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to initialize gRPC services", [
            error.message,
          ]);
    logError("gRPC services initialization failed", apiError, {
      correlationId,
    });
    throw apiError; // Rethrow for main app to handle
  }
}

// Graceful shutdown of gRPC services
async function shutdownGrpcServices() {
  const correlationId = addCorrelationId({}, {}, () => {}).correlationId;

  try {
    safeLogger.info("Shutting down gRPC services", { correlationId });
    await stopAuthGrpcServer();
    safeLogger.info("gRPC services shut down successfully", { correlationId });
  } catch (error) {
    logError("Error during gRPC services shutdown", error, { correlationId });
    throw new ApiError(500, "Failed to shut down gRPC services", [
      error.message,
    ]);
  }
}

export { initializeGrpcServices, shutdownGrpcServices };
