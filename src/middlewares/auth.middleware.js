import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import AuthUser from "../models/authuser.model.js";
import { env } from "../config/env.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers["authorization"]?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Access token missing");
  }

  try {
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    const user = await AuthUser.findByPk(decoded.id);

    if (!user || !user.isActive) {
      throw new ApiError(401, "User not found or inactive");
    }

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
    throw new ApiError(401, "Invalid or expired access token");
  }
});
