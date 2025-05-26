import User from "../../models/user.model.js";
import AuthToken from "../../models/auth-tokens.model.js";
import logger from "../../config/logger.js";
import jwt from "jsonwebtoken";

export async function getUserAuthInfo(call, callback) {
  try {
    const { email } = call.request;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return callback(null, {
        error: { code: 404, message: "User not found" },
      });
    }
    callback(null, { email: user.email, is_active: user.isActive });
  } catch (error) {
    logger.error("gRPC GetUserAuthInfo error:", error);
    callback(null, { error: { code: 500, message: "Internal server error" } });
  }
}

export async function validateToken(call, callback) {
  try {
    const { access_token } = call.request;
    const token = await AuthToken.findOne({
      where: { accessToken: access_token, isValid: true },
    });
    if (!token || token.expiresAt < new Date()) {
      return callback(null, {
        is_valid: false,
        error: { code: 401, message: "Invalid or expired token" },
      });
    }
    const decoded = jwt.verify(access_token, process.env.JWT_SECRET);
    callback(null, { is_valid: true, user_id: decoded.userId });
  } catch (error) {
    logger.error("gRPC ValidateToken error:", error);
    callback(null, { error: { code: 500, message: "Internal server error" } });
  }
}
