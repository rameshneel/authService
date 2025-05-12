import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "your_google_client_id",
  GOOGLE_CLIENT_SECRET:
    process.env.GOOGLE_CLIENT_SECRET || "your_google_client_secret",
  GOOGLE_REDIRECT_URI:
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3001/auth/google/callback",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost",
  GRPC_AUTH_SERVICE_HOST: process.env.GRPC_AUTH_SERVICE_HOST || "localhost",
  GRPC_AUTH_SERVICE_PORT: process.env.GRPC_AUTH_SERVICE_PORT || 50051,
};
