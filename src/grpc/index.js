import { safeLogger } from "../config/logger.js";
import { startGrpcServer, stopGrpcServer } from "./server/auth.server.js";
import { initializeUserHealth, stopMonitoring } from "./client/userHealth.js";

// Initialize gRPC services
async function initializeGrpcServices() {
  try {
    initializeUserHealth();
    await startGrpcServer();
  } catch (error) {
    safeLogger.error("Error starting gRPC server", error);
    process.exit(1);
  }
}

// Graceful shutdown of gRPC services
async function shutdownGrpcServices() {
  try {
    stopMonitoring();
    await stopGrpcServer();
  } catch (error) {
    safeLogger.error("Error during gRPC services shutdown");
    process.exit(1);
  }
}

export { initializeGrpcServices, shutdownGrpcServices };
