import { safeLogger } from "../config/logger.js";
import {
  startAuthGrpcServer,
  stopAuthGrpcServer,
} from "./server/auth.server.js";
import { checkUserServiceHealth } from "./client/userClient.js";
import { ApiError } from "../utils/ApiError.js";
import { getCorrelationId } from "../config/requestContext.js";
import AsyncRetry from "async-retry";

// Initialize gRPC services
async function initializeGrpcServices() {
  try {
    // Check user service health with retry
    // await AsyncRetry(
    //   async () => {
    //     // await checkUserServiceHealth();
    //   },
    //   {
    //     retries: 3,
    //     factor: 2,
    //     minTimeout: 1000,
    //     maxTimeout: 5000,
    //     onRetry: (error, attempt) => {
    //       safeLogger.info(
    //         `Retry attempt ${attempt} for UserService health check`,
    //         error
    //       );
    //     },
    //   }
    // );

    // Start auth gRPC server
    await startAuthGrpcServer();
  } catch (error) {
    const apiError =
      error instanceof ApiError
        ? error
        : new ApiError(500, "Failed to initialize gRPC services", [
            error.message,
          ]);
    safeLogger.error("gRPC services initialization failed", apiError);
    throw apiError;
  }
}

// Graceful shutdown of gRPC services
async function shutdownGrpcServices() {
  try {
    await stopAuthGrpcServer();
  } catch (error) {
    safeLogger.error("Error during gRPC services shutdown");
    throw new ApiError(500, "Failed to shut down gRPC services", [
      error.message,
    ]);
  }
}

export { initializeGrpcServices, shutdownGrpcServices };
