import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { env } from "../../config/env.js";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../../config/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, "../proto/auth.proto");

const server = new grpc.Server();

export function startAuthGrpcServer() {
  const address = `${env.GRPC_AUTH_SERVICE_HOST}:${env.GRPC_AUTH_SERVICE_PORT}`;

  server.bindAsync(
    address,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        logger.error("Failed to bind auth gRPC server:", error);
        return;
      }
      server.start();
      logger.info(`Auth gRPC server running at ${address}`);
    }
  );
}

export function stopAuthGrpcServer() {
  return new Promise((resolve) => {
    server.tryShutdown((error) => {
      if (error) {
        logger.error("Error during graceful shutdown:", error);
        server.forceShutdown();
      }
      logger.info("Auth gRPC server stopped");
      resolve();
    });
  });
}
