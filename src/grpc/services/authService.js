import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ApiError } from "../../utils/ApiError.js";
import { env } from "../../config/env.js";

const users = []; // Replace with database

export const login = async ({ email, password }) => {
  const user = users.find((u) => u.email === email);
  if (!user) {
    throw new ApiError(401, "Authentication Failed", [
      "Invalid email or password",
    ]);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Authentication Failed", [
      "Invalid email or password",
    ]);
  }

  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return { token, userId: user.id };
};

export const register = async ({ email, password, name }) => {
  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    throw new ApiError(400, "Registration Failed", ["Email already exists"]);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = `user_${Date.now()}`;
  users.push({ id: userId, email, password: hashedPassword, name });

  return userId;
};

export const validateToken = async (token) => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    return { valid: true, userId: decoded.userId };
  } catch (error) {
    throw new ApiError(401, "Invalid Token", [error.message]);
  }
};
