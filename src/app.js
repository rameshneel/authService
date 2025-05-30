import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { errorHandler } from "./utils/errorHandler.js";
import { logger, safeLogger } from "./config/logger.js";
import { env } from "./config/env.js";
import { correlationIdMiddleware } from "./config/requestContext.js";

const allowedOrigins = env.CORS_ORIGINS.split(",");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    secure: false,
    optionSuccessStatus: 200,
    Headers: true,
    exposedHeaders: "Set-Cookie",
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Access-Control-Allow-Origin",
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use("/public", express.static(path.join(__dirname, "..", "public")));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(correlationIdMiddleware);

//routes import
import authRoutes from "./routes/auth.route.js";

//routes declaration
app.use("/api/v1/auth", authRoutes);

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: "No route found" });
});

app.use(errorHandler);
process.on("uncaughtException", (err) => {
  safeLogger.error("Uncaught Exception", {
    message: err.message,
    stack: err.stack,
    correlationId: "uncaught",
  });
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  safeLogger.error("Unhandled Promise Rejection", {
    message: err.message,
    stack: err.stack,
    correlationId: "unhandled",
  });
  process.exit(1);
});
export { app };
