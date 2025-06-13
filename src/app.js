import express from "express";
import cors from "cors";
// import helmet from "helmet";
// import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { correlationIdMiddleware } from "./config/requestContext.js";
import { errorHandler } from "./utils/errorHandler.js";
import { env } from "./config/env.js";
import { safeLogger } from "./config/logger.js";

const allowedOrigins = env.CORS_ORIGINS.split(",");
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    exposedHeaders: ["Set-Cookie"],
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// app.use(helmet());
// app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(correlationIdMiddleware);
app.use("/public", express.static(path.join(__dirname, "..", "public")));

//routes import
import authRoutes from "./routes/auth.route.js";
import jwkRoutes from "./routes/jwk.route.js";
import companyRoutes from "./routes/company.route.js";

//routes declaration
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/jwk", jwkRoutes);
app.use("/api/v1/admin", companyRoutes);

app.get("/health", (req, res) => res.status(200).send("OK"));

// ✅ 404 and Error Handler
app.use((req, res) => res.status(404).json({ message: "No route found" }));
app.use(errorHandler);

// ✅ Global Errors
process.on("uncaughtException", (err) => {
  safeLogger.error("Uncaught Exception", {
    message: err.message,
    stack: err.stack,
    correlationId: "uncaught",
  });
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  safeLogger.error("Unhandled Rejection", {
    message: err.message,
    stack: err.stack,
    correlationId: "unhandled",
  });
  process.exit(1);
});

export { app };
