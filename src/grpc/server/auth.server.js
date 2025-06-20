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

const server = new grpc.Server();

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

server.addService(authPackage.AuthService.service, authServiceImpl);

export const startGrpcServer = async () => {
  const address = `${env.GRPC_AUTH_SERVICE_HOST}:${env.GRPC_AUTH_SERVICE_PORT}`;
  return new Promise((resolve, reject) => {
    server.bindAsync(
      address,
      grpc.ServerCredentials.createInsecure(),
      (err) => {
        if (err) {
          safeLogger.error("Error starting gRPC server", err);
          reject(err);
        }
        safeLogger.info(`grpc server is running on ${address}`);
        resolve();
      }
    );
  });
};

export const stopGrpcServer = () => {
  return new Promise((resolve) => {
    server.tryShutdown((err) => {
      if (err) {
        safeLogger.error("Error during graceful shutdown:", err);
        server.forceShutdown();
      }
      safeLogger.info("Company gRPC server stopped");
      resolve();
    });
  });
};
