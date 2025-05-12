import jwt from "jsonwebtoken";
import bcrypt from "../utils/bcrypt.js";
import axios from "axios";
import { User, AuthToken } from "../models/index.model.js";
import { env } from "../config/env.js";
import redisClient from "../config/redis.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";
import { Op } from "sequelize";
import { publishUserCreatedEvent } from "../events/emitters/userCreatedEmitter.js";
import { publishUserLoginEvent } from "../events/emitters/userLoginEmitter.js";
import { userClient } from "../grpc/client/userClient.js";

// signup function
export const signup = asyncHandler(async (req, res, next) => {
  const { email, password, name, type, role } = req.body;

  try {
    const validRoles = {
      company: ["superadmin", "admin", "manager", "salesman"],
      vendor: ["vendor"],
      customer: ["customer"],
    };

    if (!validRoles[type].includes(role)) {
      throw new ApiError(400, "Invalid role for user type");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      type,
      role,
    });

    const userData = {
      email: user.email,
      name: user.name,
      type: user.type,
      role: user.role,
    };

    // Publish UserCreated event
    await publishUserCreatedEvent(userData);

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user },
          "User registered successfully and verification email has been sent on your email."
        )
      );
  } catch (error) {
    next(error);
  }
});

// login function (with gRPC call to UserService)
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      throw new ApiError(401, "Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { id: user.id, email, type: user.type, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    // Save tokens in database
    await AuthToken.create({
      userId: user.id,
      accessToken,
      refreshToken,
      provider: "manual",
    });

    // gRPC call to get user profile data from UserService
    const userData = await userClient.getUserProfile(user.id); // gRPC call

    // Cache token in Redis
    await redisClient.setWithExpiration(
      `token:${accessToken}`,
      JSON.stringify({ id: user.id, email, type: user.type, role: user.role }),
      3600 // expiration time in seconds (1 hour)
    );

    // Set cookies (for secure access in the frontend)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined,
    };

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000, // 1 hour
    });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          token: accessToken,
          user: { id: user.id, email, type: user.type, role: user.role },
          profile: userData,
        },
        "User logged in successfully"
      )
    );
  } catch (error) {
    next(error);
  }
});

// export const signup = asyncHandler(async (req, res, next) => {
//   const { email, password, name, type, role } = req.body;

//   try {
//     const validRoles = {
//       company: ["superadmin", "admin", "manager", "salesman"],
//       vendor: ["vendor"],
//       customer: ["customer"],
//     };
//     if (!validRoles[type].includes(role)) {
//       throw new ApiError(400, "Invalid role for user type");
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = await User.create({
//       email,
//       password: hashedPassword,
//       name,
//       type,
//       role,
//     });
//     const userData = {
//       email: user.email,
//       name: user.name,
//       type: user.type,
//       role: user.role,
//     };
//     // Publish UserCreated event
//     await publishUserCreatedEvent(userData);
//     // Use ApiResponse and fix createdUser bug
//     return res
//       .status(201)
//       .json(
//         new ApiResponse(
//           201,
//           { user },
//           "User registered successfully and verification email has been sent on your email."
//         )
//       );
//   } catch (error) {
//     next(error);
//   }
// });

// export const login = asyncHandler(async (req, res, next) => {
//   const { email, password,} = req.body;

//   try {
//     const loginData = {
//       id: user.id,
//       email: user.email,
//       type: user.type,
//       role: user.role,
//       isActive: true,
//       ipAddress: ipAddress,
//       deviceInfo: deviceInfo,
//     };
//     await publishUserLoginEvent(loginData);
//     const user = await User.findOne({ where: { email } });
//     if (!user || !user.isActive) {
//       throw new ApiError(401, "Invalid credentials");
//     }

//     const isValid = await bcrypt.compare(password, user.password);
//     if (!isValid) {
//       throw new ApiError(401, "Invalid credentials");
//     }

//     const accessToken = jwt.sign(
//       { id: user.id, email, type: user.type, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );
//     const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
//       expiresIn: "30d",
//     });

//     await AuthToken.create({
//       userId: user.id,
//       accessToken,
//       refreshToken,
//       provider: "manual",
//       deviceInfo,
//       ipAddress,
//       lastUsed: new Date(),
//       expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//       isValid: true,
//     });

//     const profile = await userClient.getUserProfile(email);
//     await publishUserLoginEvent({ userId: user.id, loginAt: new Date() });

//     // Cache token in Redis with updated method
//     await redisClient.setWithExpiration(
//       `token:${accessToken}`,
//       JSON.stringify({ id: user.id, email, type: user.type, role: user.role }),
//       3600 // expiration time in seconds (1 hour)
//     );

//     // Set cookies (best practice)
//     const cookieOptions = {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production", // true in production
//       sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
//       path: "/",
//       domain: process.env.COOKIE_DOMAIN || undefined, // set if needed
//     };

//     res.cookie("accessToken", accessToken, {
//       ...cookieOptions,
//       maxAge: 60 * 60 * 1000, // 1 hour
//     });
//     res.cookie("refreshToken", refreshToken, {
//       ...cookieOptions,
//       maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
//     });

//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           token: accessToken,
//           user: { id: user.id, email, type: user.type, role: user.role },
//           profile,
//         },
//         "User logged in successfully"
//       )
//     );
//   } catch (error) {
//     next(error);
//   }
// });

export const googleAuth = asyncHandler(async (req, res, next) => {
  try {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${env.GOOGLE_REDIRECT_URI}&response_type=code&scope=email profile`;
    // No ApiResponse needed for redirect
    res.redirect(url);
  } catch (error) {
    next(error);
  }
});

export const googleCallback = asyncHandler(async (req, res, next) => {
  const { code } = req.query;

  try {
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    const userInfo = await axios.get(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
    );
    const { email, name } = userInfo.data;

    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        email,
        name: name || email.split("@")[0],
        type: "customer",
        role: "customer",
      });

      // Publish UserCreated event
      await publishEvent("UserCreated", {
        id: user.id,
        email,
        name,
        type: user.type,
        role: user.role,
      });
    }

    const jwtAccessToken = jwt.sign(
      { id: user.id, email, type: user.type, role: user.role },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    await AuthToken.create({
      userId: user.id,
      accessToken: access_token,
      refreshToken: refresh_token,
      provider: "google",
      providerId: userInfo.data.id,
      deviceInfo: req.headers["user-agent"],
      ipAddress: req.ip,
      lastUsed: new Date(),
      expiresAt: new Date(Date.now() + expires_in * 1000),
      isValid: true,
    });

    // Cache token in Redis
    await redisClient.setEx(
      `token:${jwtAccessToken}`,
      3600,
      JSON.stringify({ id: user.id, email, type: user.type, role: user.role })
    );

    // Use ApiResponse
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          token: jwtAccessToken,
          redirectUrl: "http://localhost:3002/profile",
        },
        "Google authentication successful"
      )
    );
  } catch (error) {
    next(error);
  }
});

export const verifyToken = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  try {
    // Check Redis cache
    const cachedUser = await redisClient.get(`token:${token}`);
    if (cachedUser) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { valid: true, user: JSON.parse(cachedUser) },
            "Token is valid"
          )
        );
    }

    // Fallback to JWT verification
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      throw new ApiError(404, "User not found");
    }

    await AuthToken.update(
      { lastUsed: new Date() },
      { where: { accessToken: token, isValid: true } }
    );

    // Cache user data in Redis
    await redisClient.setEx(
      `token:${token}`,
      3600,
      JSON.stringify({
        id: user.id,
        email: user.email,
        type: user.type,
        role: user.role,
      })
    );

    // Use ApiResponse
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            type: user.type,
            role: user.role,
          },
        },
        "Token is valid"
      )
    );
  } catch (error) {
    next(error);
  }
});

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ where: { email } });
  if (!user) throw new ApiError(404, "User not found");

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = resetTokenExpiry;
  await user.save();

  // Send email (implement sendResetPasswordEmail)
  await sendResetPasswordEmail(user.email, resetToken);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset link sent to your email"));
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword)
    throw new ApiError(400, "Token and new password are required");

  const user = await User.findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { [Op.gt]: Date.now() },
    },
  });

  if (!user) throw new ApiError(400, "Invalid or expired reset token");

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password has been reset successfully"));
});

export const logout = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.body.token;
  if (!token) throw new ApiError(400, "Token is required");

  // Invalidate token in DB
  await AuthToken.update({ isValid: false }, { where: { accessToken: token } });

  // Remove from Redis
  await redisClient.del(`token:${token}`);

  // Clear cookies (best practice)
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    path: "/",
    domain: process.env.COOKIE_DOMAIN || undefined,
  };

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

export const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, "Refresh token is required");

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const authToken = await AuthToken.findOne({
    where: { refreshToken, isValid: true },
  });
  if (!authToken) throw new ApiError(401, "Refresh token not found or invalid");

  const user = await User.findByPk(decoded.id);
  if (!user || !user.isActive)
    throw new ApiError(401, "User not found or inactive");

  const newAccessToken = jwt.sign(
    { id: user.id, email: user.email, type: user.type, role: user.role },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  // Update token in DB and Redis
  await AuthToken.update(
    { accessToken: newAccessToken, lastUsed: new Date() },
    { where: { id: authToken.id } }
  );
  await redisClient.setEx(
    `token:${newAccessToken}`,
    3600,
    JSON.stringify({
      id: user.id,
      email: user.email,
      type: user.type,
      role: user.role,
    })
  );

  // Set new access token cookie (best practice)
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    path: "/",
    domain: process.env.COOKIE_DOMAIN || undefined,
    maxAge: 60 * 60 * 1000, // 1 hour
  };

  res.cookie("accessToken", newAccessToken, cookieOptions);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { token: newAccessToken },
        "Token refreshed successfully"
      )
    );
});

export const changePassword = asyncHandler(async (req, res, next) => {
  const userId = req.user?.id; // You need to set req.user in your auth middleware
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    throw new ApiError(400, "Old and new password are required");

  const user = await User.findByPk(userId);
  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new ApiError(401, "Old password is incorrect");

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});
