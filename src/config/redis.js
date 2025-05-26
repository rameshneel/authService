//authService/src/config/redis.js

import { env } from "./env.js";
import logger from "./logger.js";
const redisConfig = {
  // Connection URL
  url: env.REDIS_URLs,
  options: {
    socket: {
      reconnectStrategy: (retries) => {
        // Maximum number of retries
        if (retries > 10) {
          logger.error("Redis connection failed after maximum retries");
          return new Error("Maximum Redis connection retries reached");
        }
        // Exponential backoff strategy: 2^retries * 100ms
        const delay = Math.min(Math.pow(2, retries) * 100, 30000);
        logger.info(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
        return delay;
      },
      connectTimeout: 10000, // 10 seconds
      keepAlive: 30000, // 30 seconds
    },

    // Connection name
    clientName: "auth-service",

    // Automatically select database
    database: parseInt(env.REDIS_DB || "0", 10),

    // For Redis 6.0+ ACL authentication
    username: env.REDIS_USERNAME,
    password: env.REDIS_PASSWORD,

    // Enable read-only mode if specified
    readOnly: env.REDIS_READ_ONLY === "true",

    // Retry strategy for commands
    commandTimeout: 5000, // 5 seconds timeout for commands
    maxRetriesPerRequest: 3,

    // Disable auto-reconnect (we handle it with reconnectStrategy)
    autoResubscribe: true,
    autoResendUnfulfilledCommands: true,

    // TLS options
    tls:
      env.REDIS_TLS === "true"
        ? {
            // TLS options
            ca: env.REDIS_CA_CERT,
            cert: env.REDIS_CLIENT_CERT,
            key: env.REDIS_CLIENT_KEY,
            servername: env.REDIS_TLS_SERVERNAME,
            rejectUnauthorized: env.REDIS_REJECT_UNAUTHORIZED !== "false",
          }
        : null,
  },

  // Cache TTL defaults
  ttl: {
    short: 60, // 1 minute
    medium: 60 * 60, // 1 hour
    long: 60 * 60 * 24, // 1 day
    veryLong: 60 * 60 * 24 * 7, // 1 week
  },

  // Key prefixes for different data types
  keyPrefix: {
    session: "auth:session:",
    user: "auth:user:",
    token: "auth:token:",
    verification: "auth:verification:",
    resetPassword: "auth:reset:",
    rateLimiting: "auth:rate:",
    cache: "auth:cache:",
  },

  // Pub/Sub channels
  channels: {
    userEvents: "auth:user:events",
    sessionEvents: "auth:session:events",
    systemEvents: "auth:system:events",
  },

  // Sentinel configuration (if using Redis Sentinel)
  sentinel:
    env.REDIS_SENTINEL_ENABLED === "true"
      ? {
          masters: env.REDIS_SENTINEL_MASTERS?.split(",") || ["mymaster"],
          sentinels: env.REDIS_SENTINEL_NODES?.split(",").map((node) => {
            const [host, port] = node.split(":");
            return { host, port: parseInt(port, 10) };
          }) || [{ host: "localhost", port: 26379 }],
          password: env.REDIS_SENTINEL_PASSWORD,
        }
      : null,

  // Cluster configuration (if using Redis Cluster)
  cluster:
    env.REDIS_CLUSTER_ENABLED === "true"
      ? {
          nodes: env.REDIS_CLUSTER_NODES?.split(",").map((node) => {
            const [host, port] = node.split(":");
            return { host, port: parseInt(port, 10) };
          }) || [{ host: "localhost", port: 6379 }],
          options: {
            enableReadyCheck: true,
            scaleReads: "slave", // Read from slaves
            maxRedirections: 16,
            retryDelayOnFailover: 100,
            retryDelayOnClusterDown: 100,
            retryDelayOnTryAgain: 100,
            slotsRefreshTimeout: 1000,
            clusterRetryStrategy: (retries) => {
              if (retries > 10) {
                return null;
              }
              return Math.min(Math.pow(2, retries) * 100, 30000);
            },
          },
        }
      : null,
};

export default redisConfig;

// import { createClient } from "redis";
// import { env } from "../config/env.js"; // Config file where Redis URL is stored

// class RedisClient {
//   constructor() {
//     this.client = null;
//     this.isConnected = false;
//   }

//   async initialize() {
//     try {
//       this.client = createClient({
//         url: env.REDIS_URL,
//         socket: {
//           reconnectStrategy: (retries) => {
//             if (retries > 10) {
//               return new Error("Redis max retries reached");
//             }
//             return Math.min(retries * 100, 3000);
//           },
//         },
//       });

//       this.client.on("error", (err) => {
//         console.error("Redis Client Error:", err);
//         this.isConnected = false;
//       });

//       this.client.on("connect", () => {
//         console.log("Redis Client Connected");
//         this.isConnected = true;
//       });

//       await this.client.connect();
//       return this.client;
//     } catch (error) {
//       console.error("Redis initialization failed:", error);
//       throw error;
//     }
//   }

//   async getClient() {
//     if (!this.client || !this.isConnected) {
//       await this.initialize();
//     }
//     return this.client;
//   }

//   async setWithExpiration(key, value, ttlInSeconds) {
//     try {
//       const client = await this.getClient();
//       await client.set(key, value, { EX: ttlInSeconds });
//     } catch (error) {
//       console.error("Error setting key in Redis:", error);
//     }
//   }

//   async get(key) {
//     try {
//       const client = await this.getClient();
//       const value = await client.get(key);
//       return value;
//     } catch (error) {
//       console.error("Error getting key from Redis:", error);
//     }
//   }

//   async disconnect() {
//     if (this.client) {
//       await this.client.quit();
//       this.isConnected = false;
//       console.log("Redis Client Disconnected");
//     }
//   }
// }

// export default new RedisClient();
