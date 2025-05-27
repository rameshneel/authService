import logger from "../config/logger.js";
import { startUserGrpcServer } from "./server/user.server.js";

async function grpcServer() {
  try {
    startUserGrpcServer();
    logger.info("gRPC server initialized");
  } catch (error) {
    logger.error("Failed to start AuthService:", error);
    throw error;
  }
}

export default grpcServer;
