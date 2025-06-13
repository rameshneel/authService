import Redis from "ioredis";
import { env } from "../config/env.js";
import { safeLogger } from "../config/logger.js";

let redis;

export async function initRedis() {
  return new Promise((resolve, reject) => {
    if (redis) return resolve(redis);

    redis = new Redis({
      host: env.REDIS_HOST || "localhost",
      port: env.REDIS_PORT || 6379,
      password: env.REDIS_PASSWORD || "root",
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      reconnectOnError: (err) => err.message.includes("READONLY"),
    });

    // Redis Events
    redis.on("connect", () => {
      safeLogger.info("✅ Redis connected");
    });

    redis.on("ready", () => {
      safeLogger.info("🚀 Redis client is ready");
      resolve(redis);
    });

    redis.on("error", (err) => {
      const message =
        err.code === "ECONNREFUSED"
          ? "❌ Redis connection refused"
          : "❌ Redis encountered an error";

      safeLogger.error(message);
      reject(err);
    });

    redis.on("reconnecting", () => {
      safeLogger.warn("🔄 Reconnecting to Redis...");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      try {
        await redis.quit();
        safeLogger.info("🛑 Redis connection closed gracefully");
        process.exit(0);
      } catch (err) {
        safeLogger.error("Error closing Redis on SIGINT", {
          message: err.message,
          stack: err.stack,
        });
        process.exit(1);
      }
    });
  });
}

export function getRedisClient() {
  if (!redis) {
    const errorMsg = "Redis client not initialized. Call initRedis() first.";
    safeLogger.error(errorMsg);
    throw new Error(errorMsg);
  }
  return redis;
}
export function closeRedisConnection() {
  if (redis) {
    return redis.quit().then(() => {
      safeLogger.info("🛑 Redis connection closed");
      redis = null;
    });
  }
  return Promise.resolve();
}
export function getRedis() {
  return redis;
}
export function isRedisConnected() {
  return redis && redis.status === "ready";
}
export function getRedisInfo() {
  if (!redis) {
    const errorMsg = "Redis client not initialized. Call initRedis() first.";
    safeLogger.error(errorMsg);
    throw new Error(errorMsg);
  }
  return redis.info();
}
