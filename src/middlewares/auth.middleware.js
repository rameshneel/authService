import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import AuthUser from "../models/authuser.model.js";
import { env } from "../config/env.js";
import { authCache } from "../cache/auth.cache.js";
import { safeLogger } from "../config/logger.js";
import { getCorrelationId } from "../config/requestContext.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const correlationId = getCorrelationId();
  const token =
    req.cookies?.accessToken ||
    req.headers["authorization"]?.replace("Bearer ", "");

  if (!token) {
    safeLogger.warn("Access token missing", { correlationId });
    throw new ApiError(401, "Access token missing");
  }

  try {
    safeLogger.info("Verifying JWT token", { correlationId });

    // Check if token is blacklisted
    const isBlacklisted = await authCache.isTokenBlacklisted(token);
    if (isBlacklisted) {
      safeLogger.warn("Token is blacklisted", { correlationId });
      throw new ApiError(401, "Token has been invalidated");
    }

    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    const user = await AuthUser.findByPk(decoded.id);

    if (!user || !user.isActive) {
      safeLogger.warn("User not found or inactive", {
        userId: decoded.id,
        correlationId,
      });
      throw new ApiError(401, "User not found or inactive");
    }

    // Get and update session data
    const sessionData = await authCache.getUserSession(user.id);
    if (sessionData) {
      sessionData.lastActive = new Date().toISOString();
      await authCache.storeUserSession(user.id, sessionData);
      safeLogger.info("Updated user session", {
        userId: user.id,
        correlationId,
      });
    }

    // Attach auth user details to the request
    req.user = {
      id: user.id,
      linkedUserId: user.linkedUserId,
      email: user.email,
      type: user.type,
      role: user.role,
    };

    safeLogger.info("JWT verification successful", {
      userId: user.id,
      correlationId,
    });

    next();
  } catch (error) {
    safeLogger.error("JWT verification failed", {
      message: error.message,
      stack: error.stack,
      correlationId,
    });

    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, "Invalid token", [error.message]);
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, "Token expired", [error.message]);
    }

    throw new ApiError(401, "Invalid or expired access token", [error.message]);
  }
});
