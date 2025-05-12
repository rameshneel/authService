import logger from "../config/logger.js";
import { startGrpcServer } from "./server/authServer.js";

async function grpcServer() {
  try {
    startGrpcServer();
    logger.info("gRPC server initialized");
  } catch (error) {
    logger.error("Failed to start AuthService:", error);
    throw error;
  }
}

export default grpcServer;
