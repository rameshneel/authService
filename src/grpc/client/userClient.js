import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../../config/env.js";
import logger from "../../config/logger.js";

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

const DEADLINE_MS = 10000; // 10 seconds

// Connection health check
export const checkUserServiceHealth = () => {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 5000;

    client.waitForReady(deadline, (error) => {
      if (error) {
        logger.error("UserService not ready:", error);
        reject(error);
      } else {
        logger.info("UserService is ready");
        resolve();
      }
    });
  });
};

// Create user profile
export const createUserProfile = (userData) => {
  console.log("userData", userData);

  return new Promise((resolve, reject) => {
    const deadline = Date.now() + DEADLINE_MS;

    logger.info("Sending user data to UserService:", userData);

    client.CreateProfile(userData, { deadline }, (err, response) => {
      if (err) {
        logger.error("gRPC CreateProfile error:", {
          code: err.code,
          message: err.message,
          details: err.details,
        });
        return reject(err);
      }

      logger.info("gRPC CreateProfile response:", response);
      resolve(response);
    });
  });
};
// Get user by ID
export const getUserById = (userId) => {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + DEADLINE_MS;

    client.GetUserById({ userId }, { deadline }, (err, response) => {
      if (err) {
        logger.error("gRPC GetUserById error:", err);
        return reject(err);
      }

      logger.info("gRPC GetUserById response:", response);
      resolve(response);
    });
  });
};

// Connection monitoring
// client
//   .getChannel()
//   .watchConnectivityState(
//     grpc.connectivityState.IDLE,
//     Date.now() + 5000,
//     (error) => {
//       if (error) {
//         logger.error("Connection state change error:", error);
//       } else {
//         logger.info("Connection state changed to UserService");
//       }
//     }
//   );

export default client;
