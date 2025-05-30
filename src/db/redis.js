import Redis from "ioredis";
import { env } from "../config/env.js";

let redis;

export async function initRedis() {
  if (!redis) {
    redis = new Redis({
      host: env.REDIS_HOST || "localhost",
      port: env.REDIS_PORT || 6379,
      password: env.REDIS_PASSWORD || "root",
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      reconnectOnError: (err) => err.message.includes("READONLY"),
    });

    // Events
    redis.on("error", (err) => {
      if (err.code === "ECONNREFUSED") {
        console.error("❌ Could not connect to Redis server.");
      } else {
        console.error("❌ Redis error:", err);
      }
    });

    redis.on("connect", () => {
      console.log("✅ Successfully connected to Redis");
    });

    redis.on("ready", () => {
      console.log("🚀 Redis client ready");
    });

    redis.on("reconnecting", () => {
      console.log("🔄 Reconnecting to Redis...");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      try {
        await redis.quit();
        console.log("🛑 Redis connection closed");
        process.exit(0);
      } catch (err) {
        console.error("Error closing Redis:", err);
        process.exit(1);
      }
    });
  }

  return redis;
}

export function getRedisClient() {
  if (!redis) {
    throw new Error("Redis client not initialized. Call initRedis() first.");
  }
  return redis;
}
