// import logger from "../config/logger.js";
// import { startUserGrpcServer } from "./server/user.server.js";

// async function grpcServer() {
//   try {
//     startUserGrpcServer();
//     logger.info("gRPC server initialized");
//   } catch (error) {
//     logger.error("Failed to start AuthService:", error);
//     throw error;
//   }
// }

// export default grpcServer;

// user.grpc.client.js
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, "./proto/hi.proto");
const packageDef = protoLoader.loadSync(PROTO_PATH);
const grpcObj = grpc.loadPackageDefinition(packageDef);
const hiPackage = grpcObj.hiPackage;

const client = new hiPackage.HiService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

export function sendHiToUserService() {
  client.SayHi({ message: "hi from Auth" }, (err, response) => {
    if (err) return console.error("❌ gRPC error:", err);
    console.log("✅ Response from User:", response.message);
  });
}
