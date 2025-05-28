import logger from "../config/logger.js";
import { startAuthGrpcServer } from "./server/auth.server.js";
import { checkUserServiceHealth } from "./client/userClient.js";

async function initializeGrpcServices() {
  try {
    // Start auth gRPC server
    startAuthGrpcServer();

    // Check user service connection
    setTimeout(async () => {
      try {
        await checkUserServiceHealth();
        logger.info("Successfully connected to UserService");
      } catch (error) {
        logger.error("Failed to connect to UserService:", error);
      }
    }, 2000);

    logger.info("Auth gRPC services initialized");
  } catch (error) {
    logger.error("Failed to initialize gRPC services:", error);
    throw error;
  }
}

export default initializeGrpcServices;
