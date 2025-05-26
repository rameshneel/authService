// authService/src/grpc/server/authServer.js
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../../config/env.js";
import logger from "../../config/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, "../proto/auth.proto");
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

server.addService(authPackage.AuthService.service, {
  Register: (call, callback) => {
    const { email, password, name } = call.request;
    // TODO: Implement registration logic
    callback(null, { message: "User registered successfully", success: true });
  },
  Login: (call, callback) => {
    const { email, password } = call.request;
    // TODO: Implement login logic
    callback(null, {
      message: "Login successful",
      token: "dummy-token",
      success: true,
    });
  },
  Logout: (call, callback) => {
    const { token } = call.request;
    // TODO: Implement logout logic
    callback(null, { message: "Logout successful", success: true });
  },
  CheckAuthStatus: (call, callback) => {
    const { token } = call.request;
    // TODO: Implement auth status check logic
    callback(null, { isAuthenticated: true, message: "User is authenticated" });
  },
});

export function startGrpcServer() {
  server.bindAsync(
    `${env.GRPC_AUTH_SERVICE_HOST}:${env.GRPC_AUTH_SERVICE_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        logger.error("Failed to start AuthService:", error);
        return;
      }
      server.start();
      logger.info(`AuthService gRPC server running on port ${port}`);
    }
  );
}

// import { Server, ServerCredentials } from "@grpc/grpc-js";
// import { loadSync } from "@grpc/proto-loader";
// import path from "path";
// import { fileURLToPath } from "url";
// import grpcConfig from "../../config/grpc.js";
// import logger from "../../config/logger.js";
// import { getUserAuthInfo, validateToken } from "../services/auth.service.js";
// import grpc from "@grpc/grpc-js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const protoPath = path.join(grpcConfig.protoFiles.path, "auth.proto");
// const packageDefinition = loadSync(
//   protoPath,
//   grpcConfig.protoFiles.loaderOptions
// );
// const authProto = grpc.loadPackageDefinition(packageDefinition).auth;

// function loggingInterceptor(call, callback, next) {
//   const method = call.method_definition.path;
//   grpcConfig.server.middleware.logging.logRequest(method, call.request);
//   const originalCallback = callback;
//   callback = (error, response) => {
//     if (error) {
//       grpcConfig.server.middleware.logging.logError(method, error);
//     } else {
//       grpcConfig.server.middleware.logging.logResponse(method, response);
//     }
//     originalCallback(error, response);
//   };
//   next(call, callback);
// }

// export function startGrpcServer() {
//   const server = new Server();
//   server.addService(authProto.AuthService.service, {
//     GetUserAuthInfo: loggingInterceptor.bind(null, getUserAuthInfo),
//     ValidateToken: loggingInterceptor.bind(null, validateToken),
//   });

//   const credentials =
//     grpcConfig.server.secure && grpcConfig.server.credentials.rootCerts
//       ? ServerCredentials.createSsl(
//           Buffer.from(grpcConfig.server.credentials.rootCerts),
//           [
//             {
//               private_key: Buffer.from(
//                 grpcConfig.server.credentials.privateKey
//               ),
//               cert_chain: Buffer.from(grpcConfig.server.credentials.certChain),
//             },
//           ]
//         )
//       : ServerCredentials.createInsecure();

//   server.bindAsync(
//     `${grpcConfig.server.host}:${grpcConfig.server.port}`,
//     credentials,
//     () => {
//       server.start();
//       logger.info(
//         `gRPC server running on ${grpcConfig.server.host}:${grpcConfig.server.port}`
//       );
//     }
//   );
// }
