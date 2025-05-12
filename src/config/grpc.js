import path from "path";
import { fileURLToPath } from "url";
import { env } from "./env.js";
import logger from "../config/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const grpcConfig = {
  server: {
    host: env.GRPC_SERVER_HOST || "0.0.0.0",
    port: env.GRPC_SERVER_PORT || 50051,
    options: {
      "grpc.max_receive_message_length": 1024 * 1024 * 100, // 100MB
      "grpc.max_send_message_length": 1024 * 1024 * 100, // 100MB
      "grpc.keepalive_time_ms": 120000, // 2 minutes
      "grpc.keepalive_timeout_ms": 20000, // 20 seconds
      "grpc.keepalive_permit_without_calls": 1,
      "grpc.http2.min_time_between_pings_ms": 120000, // 2 minutes
      "grpc.http2.max_pings_without_data": 0,
    },
    credentials: {
      rootCerts: env.GRPC_ROOT_CERTS_PATH || null,
      privateKey: env.GRPC_PRIVATE_KEY_PATH || null,
      certChain: env.GRPC_CERT_CHAIN_PATH || null,
    },
    secure: env.GRPC_SECURE === "true",
    healthCheck: {
      enabled: true,
      checkInterval: 30000, // 30 seconds
    },
    reflection: {
      enabled: env.NODE_ENV !== "production", // Disable in production
    },
    middleware: {
      logging: {
        enabled: true,
        logRequest: (method, request) =>
          logger.info(`gRPC request: ${method}`, request),
        logResponse: (method, response) =>
          logger.info(`gRPC response: ${method}`, response),
        logError: (method, error) =>
          logger.error(`gRPC error: ${method}`, error),
      },
      authentication: false,
      rateLimiting: false,
    },
  },
  clients: {
    userService: {
      host: env.USER_SERVICE_HOST || "localhost",
      port: env.USER_SERVICE_PORT || 50052,
      options: {
        "grpc.max_receive_message_length": 1024 * 1024 * 100,
        "grpc.max_send_message_length": 1024 * 1024 * 100,
        "grpc.keepalive_time_ms": 120000,
        "grpc.keepalive_timeout_ms": 20000,
        "grpc.keepalive_permit_without_calls": 1,
        "grpc.http2.min_time_between_pings_ms": 120000,
        "grpc.http2.max_pings_without_data": 0,
        "grpc.enable_retries": 1,
        "grpc.service_config": JSON.stringify({
          methodConfig: [
            {
              name: [{ service: "UserService" }],
              retryPolicy: {
                maxAttempts: 5,
                initialBackoff: "1s",
                maxBackoff: "10s",
                backoffMultiplier: 2,
                retryableStatusCodes: ["UNAVAILABLE", "DEADLINE_EXCEEDED"],
              },
            },
          ],
        }),
      },
      credentials: {
        rootCerts: env.USER_SERVICE_ROOT_CERTS_PATH || null,
        privateKey: env.USER_SERVICE_PRIVATE_KEY_PATH || null,
        certChain: env.USER_SERVICE_CERT_CHAIN_PATH || null,
      },
      secure: env.USER_SERVICE_SECURE === "true",
      deadline: 30000,
      retry: {
        enabled: true,
        maxRetries: 5,
        initialBackoff: 1000,
        maxBackoff: 10000,
        backoffMultiplier: 2,
        retryableStatusCodes: ["UNAVAILABLE", "DEADLINE_EXCEEDED"],
      },
    },
  },
  protoFiles: {
    path: path.join(__dirname, "../grpc/proto"),
    files: ["auth.proto", "common.proto"],
    loaderOptions: {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    },
  },
};

export default grpcConfig;
