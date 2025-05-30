import { getRedisClient } from "../db/redis.js";

const PREFIX = {
  USER_SESSION: "user:session:",
  BLACKLISTED_TOKEN: "blacklist:token:",
};

const EXPIRY = {
  USER_SESSION: 24 * 60 * 60, // 24 hours
  BLACKLISTED_TOKEN: 7 * 24 * 60 * 60, // 7 days
};

export const authCache = {
  async storeUserSession(userId, sessionData) {
    const redis = getRedisClient();
    const key = `${PREFIX.USER_SESSION}${userId}`;
    await redis.set(
      key,
      JSON.stringify(sessionData),
      "EX",
      EXPIRY.USER_SESSION
    );
  },

  async getUserSession(userId) {
    const redis = getRedisClient();
    const key = `${PREFIX.USER_SESSION}${userId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async removeUserSession(userId) {
    const redis = getRedisClient();
    const key = `${PREFIX.USER_SESSION}${userId}`;
    await redis.del(key);
  },

  async blacklistToken(token) {
    const redis = getRedisClient();
    const key = `${PREFIX.BLACKLISTED_TOKEN}${token}`;
    await redis.set(key, "1", "EX", EXPIRY.BLACKLISTED_TOKEN);
  },

  async isTokenBlacklisted(token) {
    const redis = getRedisClient();
    const key = `${PREFIX.BLACKLISTED_TOKEN}${token}`;
    return await redis.exists(key);
  },

  async addUserSession(userId, sessionId) {
    const redis = getRedisClient();
    const key = `${PREFIX.USER_SESSION}${userId}:sessions`;
    await redis.sadd(key, sessionId);
  },

  async getUserSessions(userId) {
    const redis = getRedisClient();
    const key = `${PREFIX.USER_SESSION}${userId}:sessions`;
    return await redis.smembers(key);
  },

  async removeUserSessionById(userId, sessionId) {
    const redis = getRedisClient();
    const key = `${PREFIX.USER_SESSION}${userId}:sessions`;
    await redis.srem(key, sessionId);
  },

  async clearUserSessions(userId) {
    const redis = getRedisClient();
    const key = `${PREFIX.USER_SESSION}${userId}:sessions`;
    await redis.del(key);
  },
};
