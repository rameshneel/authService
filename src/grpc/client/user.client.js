import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../../config/env.js";
import { safeLogger } from "../../config/logger.js";
import { ApiError } from "../../utils/ApiError.js";
// import { isServiceHealthy } from "./userHealth.js";

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

// Create user profile
export const createUserProfile = (userData) => {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + DEADLINE_MS;

    // if (!isServiceHealthy()) {
    //   return reject(new ApiError(500, "User service is not healthy"));
    // }

    safeLogger.info("Sending user data to UserService", {
      userData,
    });

    client.CreateProfile(userData, { deadline }, (err, response) => {
      if (err) {
        return reject(
          new ApiError(
            err.code === grpc.status.NOT_FOUND ? 404 : 500,
            `Failed to create user profile: ${err.message}`
          )
        );
      }

      safeLogger.info(response?.message, {
        response,
      });
      resolve(response);
    });
  });
};

// Get user by ID
export const getUserById = (userId, type) => {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + DEADLINE_MS;
    client.GetUserById({ userId, type }, { deadline }, (err, response) => {
      if (err) {
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
      });
      resolve(response);
    });
  });
};

export default client;
