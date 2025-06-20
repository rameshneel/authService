import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 3000,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "your_jwt_secret",
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "30min",
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
  DB_USER: process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "0000",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_NAME: process.env.DB_NAME || "auth_service",
  CORS_ORIGINS: process.env.CORS_ORIGIN || [],
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || "http://localhost:8900",
  GRPC_SERVER_HOST: process.env.GRPC_SERVER_HOST || "localhost",
  GRPC_SERVER_PORT: process.env.GRPC_SERVER_PORT || "50050",
  GRPC_USER_SERVICE_HOST: process.env.GRPC_USER_SERVICE_HOST || "localhost",
  GRPC_USER_SERVICE_PORT: process.env.GRPC_USER_SERVICE_PORT || "50051",
  PRIVATE_KEY_EXIPRY: process.env.PRIVATE_KEY_EXIPRY || "1h",
  KEY_ROTATION_TIME: process.env.KEY_ROTATION_TIME || "2h",
  PRIVATE_KEY_RETENTION: process.env.PRIVATE_KEY_RETENTION || "2h",
};
