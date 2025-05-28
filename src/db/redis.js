import Redis from "ioredis";
import { env } from "../config/env.js";

// Create Redis client with retry strategy
const redis = new Redis({
  host: env.REDIS_HOST || "localhost",
  port: env.REDIS_PORT || 6379,
  password: env.REDIS_PASSWORD || "root",
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  reconnectOnError: (err) => {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

// Enhanced error handling
redis.on("error", (err) => {
  console.error("Redis Connection Error:", err.message);
  if (err.code === "ECONNREFUSED") {
    console.error(
      "Could not connect to Redis server. Please check if Redis is running."
    );
  }
});

redis.on("connect", () => {
  console.log("Successfully connected to Redis");
});

redis.on("ready", () => {
  console.log("Redis client is ready to accept commands");
});

redis.on("reconnecting", () => {
  console.log("Reconnecting to Redis...");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  try {
    await redis.quit();
    console.log("Redis connection closed gracefully");
    process.exit(0);
  } catch (err) {
    console.error("Error while closing Redis connection:", err);
    process.exit(1);
  }
});

export default redis;
