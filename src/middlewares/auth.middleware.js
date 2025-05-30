import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import AuthUser from "../models/authuser.model.js";
import { jwtVerify } from "jose";
import { getPublicKey } from "../crypto/getKeys.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers["authorization"]?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Access token missing");
  }

  try {
    // Check if token is blacklisted
    // const isBlacklisted = await authCache.isTokenBlacklisted(token);
    // if (isBlacklisted) {
    //   throw new ApiError(401, "Token has been invalidated");
    // }

    const signingKey = await getPublicKey();

    if (!signingKey) {
      throw new ApiError(500, "Signing key not found");
    }

    const { payload } = await jwtVerify(token, signingKey, {
      algorithms: ["RS256"],
    });

    const user = await AuthUser.findByPk(payload.id);

    if (!user || !user.isActive) {
      throw new ApiError(401, "User not found or inactive");
    }

    // Get and update session data
    // const sessionData = await authCache.getUserSession(user.id);
    // if (sessionData) {
    //   sessionData.lastActive = new Date().toISOString();
    //   await authCache.storeUserSession(user.id, sessionData);
    // }

    // Attach auth user details to the request
    req.user = {
      id: user.id,
      linkedUserId: user.linkedUserId,
      email: user.email,
      type: user.type,
      role: user.role,
    };

    next();
  } catch (err) {
    throw new ApiError(401, err.message || "Invalid access token");
  }
});
