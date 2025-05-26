import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { env } from "../../config/env.js";

const PROTO_PATH = path.join(__dirname, "../../proto/user.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const userPackage = grpcObject.userPackage;

const server = new grpc.Server();

server.addService(userPackage.UserService.service, {
  GetUserById: (call, callback) => {
    // Mocked user data, ideally fetched from database
    const user = {
      id: call.request.userId,
      name: "Demo User",
      email: "demo@example.com",
      phone: "123-456-7890",
      avatar: "path_to_avatar_image",
    };
    callback(null, user);
  },
});

server.bindAsync(
  `${env.GRPC_USER_SERVICE_HOST}:${env.GRPC_USER_SERVICE_PORT}`,
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log("UserService gRPC server running");
    server.start();
  }
);
