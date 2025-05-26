//authService/src/db/redis.js

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

// import { createClient } from "redis";
// import redisConfig from "../config/redis.js";
// import logger from "../config/logger.js";

// class RedisClient {
//   constructor() {
//     this.client = null;
//     this.subscriber = null;
//     this.publisher = null;
//     this.isConnected = false;
//     this.isConnecting = false;
//     this.subscribers = new Map();
//   }

//   async init() {
//     if (this.client || this.isConnecting) return;

//     try {
//       this.isConnecting = true;
//       logger.info("Connecting to Redis...");

//       // Create main client
//       this.client = createClient({
//         url: redisConfig.url,
//         ...redisConfig.options,
//       });

//       // Create dedicated subscriber client for pub/sub
//       this.subscriber = this.client.duplicate();

//       // Create dedicated publisher client for pub/sub
//       this.publisher = this.client.duplicate();

//       // Set up event handlers for main client
//       this._setupEventListeners(this.client, "Main");

//       // Set up event handlers for subscriber client
//       this._setupEventListeners(this.subscriber, "Subscriber");

//       // Set up event handlers for publisher client
//       this._setupEventListeners(this.publisher, "Publisher");

//       // Connect to Redis
//       await Promise.all([
//         this.client.connect(),
//         this.subscriber.connect(),
//         this.publisher.connect(),
//       ]);

//       this.isConnected = true;
//       this.isConnecting = false;
//       logger.info("Successfully connected to Redis");
//     } catch (error) {
//       this.isConnecting = false;
//       logger.error(`Failed to connect to Redis: ${error.message}`);
//       throw error;
//     }
//   }

//   _setupEventListeners(client, name) {
//     client.on("error", (error) => {
//       logger.error(`Redis ${name} client error: ${error.message}`);
//     });

//     client.on("connect", () => {
//       logger.info(`Redis ${name} client connected`);
//     });

//     client.on("ready", () => {
//       logger.info(`Redis ${name} client ready`);
//     });

//     client.on("reconnecting", () => {
//       logger.info(`Redis ${name} client reconnecting`);
//     });

//     client.on("end", () => {
//       logger.info(`Redis ${name} client connection closed`);
//       this.isConnected = false;
//     });
//   }

//   isClientConnected() {
//     return this.isConnected && this.client?.isOpen;
//   }

//   getClient() {
//     if (!this.isClientConnected()) {
//       throw new Error("Redis client not connected");
//     }
//     return this.client;
//   }

//   async set(key, value, options = {}) {
//     if (!this.isClientConnected()) {
//       await this.init();
//     }

//     const serializedValue =
//       typeof value === "object" ? JSON.stringify(value) : value.toString();

//     if (options.ttl) {
//       return this.client.set(key, serializedValue, { EX: options.ttl });
//     }

//     return this.client.set(key, serializedValue);
//   }

//   async get(key, parse = false) {
//     if (!this.isClientConnected()) {
//       await this.init();
//     }

//     const value = await this.client.get(key);

//     if (value && parse) {
//       try {
//         return JSON.parse(value);
//       } catch (error) {
//         logger.warn(
//           `Failed to parse Redis value for key ${key}: ${error.message}`
//         );
//         return value;
//       }
//     }

//     return value;
//   }

//   async del(key) {
//     if (!this.isClientConnected()) {
//       await this.init();
//     }

//     return this.client.del(key);
//   }

//   async exists(key) {
//     if (!this.isClientConnected()) {
//       await this.init();
//     }

//     const result = await this.client.exists(key);
//     return result === 1;
//   }

//   async expire(key, seconds) {
//     if (!this.isClientConnected()) {
//       await this.init();
//     }

//     const result = await this.client.expire(key, seconds);
//     return result === 1;
//   }

//   async incr(key, amount = 1) {
//     if (!this.isClientConnected()) {
//       await this.init();
//     }

//     if (amount === 1) {
//       return this.client.incr(key);
//     }

//     return this.client.incrBy(key, amount);
//   }

//   async decr(key, amount = 1) {
//     if (!this.isClientConnected()) {
//       await this.init();
//     }

//     if (amount === 1) {
//       return this.client.decr(key);
//     }

//     return this.client.decrBy(key, amount);
//   }

//   async hset(key, data) {
//     if (!this.isClientConnected()) {
//       await this.init();
//     }

//     // Process data to ensure all values are strings
//     const processedData = {};
//     for (const [field, value] of Object.entries(data)) {
//       processedData[field] =
//         typeof value === "object" ? JSON.stringify(value) : value.toString();
//     }

//     await this.client.hSet(key, processedData);
//     return true;
//   }

//   async hgetall(key) {
//     if (!this.isClientConnected()) {
//       await this.init();
//     }

//     const data = await this.client.hGetAll(key);

//     // If object is empty, return null
//     if (Object.keys(data).length === 0) {
//       return null;
//     }

//     // Parse JSON values
//     for (const field in data) {
//       try {
//         if (data[field].startsWith("{") || data[field].startsWith("[")) {
//           data[field] = JSON.parse(data[field]);
//         }
//       } catch (error) {
//         // Keep as string if not valid JSON
//       }
//     }

//     return data;
//   }

//   async hget(key, field, parse = false) {
//     if (!this.isClientConnected()) {
//       await this.init();
//     }

//     const value = await this.client.hGet(key, field);

//     if (value && parse) {
//       try {
//         return JSON.parse(value);
//       } catch (error) {
//         return value;
//       }
//     }

//     return value;
//   }

//   async hdel(key, field) {
//     if (!this.isClientConnected()) {
//       await this.init();
//     }

//     return this.client.hDel(key, field);
//   }

//   async sadd(key, members) {
//     if (!this.isClientConnected()) {
//       await this.init();
//     }

//     if (Array.isArray(members)) {
//       return this.client.sAdd(key, members);
//     }

//     return this.client.sAdd(key, members);
//   }

//   async smembers(key) {
//     if (!this.isClientConnected()) {
//       await this.init();
//     }

//     return this.client.sMembers(key);
//   }

//   async sismember(key, member) {
//     if (!this.isClientConnected()) {
//       await this.init();
//     }

//     const result = await this.client.sIsMember(key, member);
//     return result === 1;
//   }

//   async srem(key, member) {
//     if (!this.isClientConnected()) {
//       await this.init();
//     }

//     return this.client.sRem(key, member);
//   }

//   async listAdd(key, element, prepend = false) {
//     if (!this.isClientConnected()) {
//       await this.init();
//     }

//     const serializedElement =
//       typeof element === "object"
//         ? JSON.stringify(element)
//         : element.toString();

//     if (prepend) {
//       return this.client.lPush(key, serializedElement);
//     }

//     return this.client.rPush(key, serializedElement);
//   }

//   async listRange(key, start = 0, stop = -1, parse = false) {
//     if (!this.isClientConnected()) {
//       await this.init();
//     }

//     const elements = await this.client.lRange(key, start, stop);

//     if (parse) {
//       return elements.map((element) => {
//         try {
//           return JSON.parse(element);
//         } catch (error) {
//           return element;
//         }
//       });
//     }

//     return elements;
//   }

//   async publish(channel, message) {
//     if (!this.publisher || !this.publisher.isOpen) {
//       await this.init();
//     }

//     const serializedMessage =
//       typeof message === "object"
//         ? JSON.stringify(message)
//         : message.toString();
//     return this.publisher.publish(channel, serializedMessage);
//   }

//   async subscribe(channel, callback) {
//     if (!this.subscriber || !this.subscriber.isOpen) {
//       await this.init();
//     }

//     // Unsubscribe if already subscribed
//     if (this.subscribers.has(channel)) {
//       await this.unsubscribe(channel);
//     }

//     // Store callback in subscribers map
//     this.subscribers.set(channel, callback);

//     // Subscribe to channel
//     await this.subscriber.subscribe(channel, (message) => {
//       try {
//         // Try to parse message as JSON
//         const parsedMessage = JSON.parse(message);
//         callback(parsedMessage);
//       } catch (error) {
//         // Use raw message if not valid JSON
//         callback(message);
//       }
//     });

//     logger.info(`Subscribed to Redis channel: ${channel}`);
//   }

//   async unsubscribe(channel) {
//     if (!this.subscriber || !this.subscriber.isOpen) {
//       return;
//     }

//     await this.subscriber.unsubscribe(channel);
//     this.subscribers.delete(channel);
//     logger.info(`Unsubscribed from Redis channel: ${channel}`);
//   }

//   async close() {
//     if (this.subscriber && this.subscriber.isOpen) {
//       await this.subscriber.quit();
//       logger.info("Redis subscriber connection closed");
//     }

//     if (this.publisher && this.publisher.isOpen) {
//       await this.publisher.quit();
//       logger.info("Redis publisher connection closed");
//     }

//     if (this.client && this.client.isOpen) {
//       await this.client.quit();
//       logger.info("Redis main connection closed");
//     }

//     this.isConnected = false;
//   }
// }

// // Create singleton instance
// const redisClient = new RedisClient();

// export default redisClient;
