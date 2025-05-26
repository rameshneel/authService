import redis from "../db/redis.js";

// Cache key prefixes
const PREFIX = {
  USER_SESSION: "user:session:",
  BLACKLISTED_TOKEN: "blacklist:token:",
};

// Cache expiration times (in seconds)
const EXPIRY = {
  USER_SESSION: 24 * 60 * 60, // 24 hours
  BLACKLISTED_TOKEN: 7 * 24 * 60 * 60, // 7 days
};

export const authCache = {
  async storeUserSession(userId, sessionData) {
    const key = `${PREFIX.USER_SESSION}${userId}`;
    await redis.set(key, JSON.stringify(sessionData), {
      ttl: EXPIRY.USER_SESSION,
    });
  },

  async getUserSession(userId) {
    const key = `${PREFIX.USER_SESSION}${userId}`;
    const data = await redis.get(key, true); // true for JSON parsing
    return data;
  },

  async removeUserSession(userId) {
    const key = `${PREFIX.USER_SESSION}${userId}`;
    await redis.del(key);
  },

  async blacklistToken(token) {
    const key = `${PREFIX.BLACKLISTED_TOKEN}${token}`;
    await redis.set(key, "1", { ttl: EXPIRY.BLACKLISTED_TOKEN });
  },

  async isTokenBlacklisted(token) {
    const key = `${PREFIX.BLACKLISTED_TOKEN}${token}`;
    return await redis.exists(key);
  },

  async addUserSession(userId, sessionId) {
    const key = `${PREFIX.USER_SESSION}${userId}:sessions`;
    await redis.sadd(key, sessionId);
  },

  async getUserSessions(userId) {
    const key = `${PREFIX.USER_SESSION}${userId}:sessions`;
    return await redis.smembers(key);
  },

  async removeUserSession(userId, sessionId) {
    const key = `${PREFIX.USER_SESSION}${userId}:sessions`;
    await redis.srem(key, sessionId);
  },

  async clearUserSessions(userId) {
    const key = `${PREFIX.USER_SESSION}${userId}:sessions`;
    await redis.del(key);
  },
};
