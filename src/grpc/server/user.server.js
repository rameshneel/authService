import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { env } from "../../config/env.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, "../../grpc/proto/user.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const grpcObject = grpc.loadPackageDefinition(packageDefinition);

const server = new grpc.Server();

export function startUserGrpcServer() {
  server.bindAsync(
    `${env.GRPC_USER_SERVICE_HOST}:${env.GRPC_USER_SERVICE_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    () => {
      console.log(
        `UserService gRPC server running on ${env.GRPC_USER_SERVICE_HOST}:${env.GRPC_USER_SERVICE_PORT}`
      );
    }
  );
}
