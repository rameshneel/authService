import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../../config/env.js";

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

export const createUserProfile = (userData) => {
  return new Promise((resolve, reject) => {
    client.CreateProfile(userData, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
};

// // authService/src/grpc/client/authClient.js
// import grpc from "@grpc/grpc-js";
// import protoLoader from "@grpc/proto-loader";
// import path from "path";
// import { fileURLToPath } from "url";
// import { env } from "../../config/env.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const PROTO_PATH = path.join(__dirname, "../proto/auth.proto");
// const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
//   keepCase: true,
//   longs: String,
//   enums: String,
//   defaults: true,
//   oneofs: true,
// });
// const grpcObject = grpc.loadPackageDefinition(packageDefinition);
// const authPackage = grpcObject.authPackage;

// const client = new authPackage.AuthService(
//   `${env.GRPC_AUTH_SERVICE_HOST}:${env.GRPC_AUTH_SERVICE_PORT}`,
//   grpc.credentials.createInsecure()
// );

// export function registerUser(email, password, name) {
//   return new Promise((resolve, reject) => {
//     client.Register({ email, password, name }, (err, response) => {
//       if (err) return reject(err);
//       resolve(response);
//     });
//   });
// }

// export function loginUser(email, password) {
//   return new Promise((resolve, reject) => {
//     client.Login({ email, password }, (err, response) => {
//       if (err) return reject(err);
//       resolve(response);
//     });
//   });
// }

// export function logoutUser(token) {
//   return new Promise((resolve, reject) => {
//     client.Logout({ token }, (err, response) => {
//       if (err) return reject(err);
//       resolve(response);
//     });
//   });
// }

// export function checkAuthStatus(token) {
//   return new Promise((resolve, reject) => {
//     client.CheckAuthStatus({ token }, (err, response) => {
//       if (err) return reject(err);
//       resolve(response);
//     });
//   });
// }
