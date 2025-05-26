import redisClient from "../config/redis.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const rateLimiter = async (req, res, next) => {
  const ip = req.ip;
  const key = `rate-limit:${ip}`;
  const limit = 100; // 100 requests per window
  const windowMs = 15 * 60 * 1000; // 15 minutes

  try {
    const requests = await redisClient.incr(key);
    if (requests === 1) {
      await redisClient.expire(key, windowMs / 1000);
    }

    if (requests > limit) {
      return res
        .status(429)
        .json(
          new ApiResponse(
            429,
            { error: "Too many requests" },
            "Too many requests"
          )
        );
    }

    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    next();
  }
};
