import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../../config/env.js";
import { safeLogger } from "../../config/logger.js";
import { ApiError } from "../../utils/ApiError.js";
import { getCorrelationId } from "../../config/requestContext.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, "../proto/user.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const userPackage = grpcObject.userPackage;

const client = new userPackage.UserService(
  `${env.GRPC_USER_SERVICE_HOST}:${env.GRPC_USER_SERVICE_PORT}`,
  grpc.credentials.createInsecure()
);

const DEADLINE_MS = 10000;

// Health check
export const checkUserServiceHealth = () => {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 5000;
    const correlationId = getCorrelationId();

    client.waitForReady(deadline, (error) => {
      if (error) {
        safeLogger.error("UserService not ready", {
          message: error.message,
          code: error.code,
          details: error.details,
          stack: error.stack,
          correlationId,
        });

        return reject(
          new ApiError(
            error.code === grpc.status.DEADLINE_EXCEEDED ? 504 : 503,
            "gRPC Service Unavailable",
            [error.message]
          )
        );
      }

      safeLogger.info("UserService is ready", { correlationId });
      resolve();
    });
  });
};

// Create user profile
export const createUserProfile = (userData) => {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + DEADLINE_MS;
    const correlationId = getCorrelationId();

    safeLogger.info("Sending user data to UserService", {
      userData,
      correlationId,
    });

    client.CreateProfile(userData, { deadline }, (err, response) => {
      if (err) {
        safeLogger.error("gRPC CreateProfile error", {
          message: err.message,
          code: err.code,
          details: err.details,
          stack: err.stack,
          correlationId,
        });

        return reject(
          new ApiError(
            err.code === grpc.status.NOT_FOUND ? 404 : 500,
            "Failed to create user profile",
            [err.message, err.details].filter(Boolean)
          )
        );
      }

      safeLogger.info("gRPC CreateProfile response", {
        response,
        correlationId,
      });
      resolve(response);
    });
  });
};

// Get user by ID
export const getUserById = (userId, type) => {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + DEADLINE_MS;
    const correlationId = getCorrelationId();
    client.GetUserById({ userId, type }, { deadline }, (err, response) => {
      if (err) {
        safeLogger.error("gRPC GetUserById error", {
          message: err.message,
          code: err.code,
          details: err.details,
          stack: err.stack,
          correlationId,
        });

        return reject(
          new ApiError(
            err.code === grpc.status.NOT_FOUND ? 404 : 500,
            "Failed to fetch user",
            [err.message, err.details].filter(Boolean)
          )
        );
      }

      safeLogger.info("gRPC GetUserById response", {
        response,
        correlationId,
      });
      resolve(response);
    });
  });
};

// Monitor connection changes
client
  .getChannel()
  .watchConnectivityState(
    grpc.connectivityState.IDLE,
    Date.now() + 5000,
    (error) => {
      const correlationId = getCorrelationId();
      if (error) {
        safeLogger.error("Connection state change error", {
          message: error.message,
          code: error.code,
          stack: error.stack,
          correlationId,
        });
      } else {
        safeLogger.info("Connection state changed to UserService", {
          correlationId,
        });
      }
    }
  );

export default client;
