import { asyncHandler } from "../utils/asyncHandler.js";
import axios from "axios";
import AuthUser from "../models/authuser.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { signupSchemas, commonLoginSchema } from "../validators/validation.js";
import { env } from "../config/env.js";
import jwt from "jsonwebtoken";
import { authCache } from "../cache/auth.cache.js";
import { createUserProfile, getUserById } from "../grpc/client/userClient.js";
import { safeLogger } from "../config/logger.js";

export const generateTokens = async (user) => {
  try {
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();
    return { accessToken, refreshToken };
  } catch (error) {
    safeLogger.error("Error generating tokens", {
      message: error.message,
      stack: error.stack,
      userId: user.id,
    });
    throw new ApiError(500, "Failed to generate tokens", [error.message]);
  }
};

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  path: "/",
  domain: process.env.COOKIE_DOMAIN || undefined,
};

export const signupUser = asyncHandler(async (req, res, next) => {
  const type = req?.body?.type?.toLowerCase();
  const schema = signupSchemas[type];

  if (!schema) {
    throw new ApiError(400, "Invalid user type");
  }

  const { error, value } = schema.validate(req.body);
  if (error) {
    const errorMessages = error.details.map((err) =>
      err.message.replace(/["]/g, "")
    );
    throw new ApiError(400, "Validation error", errorMessages);
  }

  const { email, password, ...profileData } = value;

  const existingUser = await AuthUser.findOne({ where: { email, type } });
  if (existingUser) {
    throw new ApiError(400, `${type} already exists with this email`);
  }

  try {
    const userData = {
      email,
      type,
      fullName: profileData.fullName,
    };

    const userResponse = await createUserProfile(userData);

    if (!userResponse) {
      throw new ApiError(400, "Failed to create user profile");
    }

    const { userId } = userResponse;
    const authUser = await AuthUser.create({
      email,
      password,
      type,
      linkedUserId: userId,
    });

    safeLogger.info("User registered successfully", {
      userId,
      authId: authUser.id,
      type,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          authId: authUser.id,
          userId,
          email: authUser.email,
          type,
        },
        `${type} registered successfully`
      )
    );
  } catch (error) {
    safeLogger.error("Signup error", {
      message: error.message,
      stack: error.stack,
      email,
      type,
    });
    next(error);
  }
});

export const loginUser = asyncHandler(async (req, res, next) => {
  const { error, value } = commonLoginSchema(req.body);

  if (error) {
    const errorMessages = error.details.map((err) =>
      err.message.replace(/["]/g, "")
    );
    throw new ApiError(400, "Login validation errors", errorMessages);
  }

  const { email, password, type } = value;

  try {
    const user = await AuthUser.findOne({ where: { email, type } });

    if (!user) {
      throw new ApiError(404, `${type} not found with this email`);
    }

    if (user.provider === "google" && user.providerId && !user.password) {
      throw new ApiError(
        400,
        "This account was created with Google. Please use 'Login with Google'."
      );
    }

    const isPasswordValid = await user.isValidPassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid email or password");
    }

    const userResponse = await getUserById(user.linkedUserId, user.type);
    if (!userResponse) {
      throw new ApiError(404, "User profile not found");
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    const sessionData = {
      userId: user.id,
      email: user.email,
      type: user.type,
      lastActive: new Date().toISOString(),
    };

    await authCache.storeUserSession(user.id, sessionData);
    await authCache.addUserSession(user.id, refreshToken);

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    safeLogger.info("User logged in successfully", {
      userId: user.id,
      type,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          token: accessToken,
          user: {
            id: user.id,
            linkedUserId: userResponse,
            email: user.email,
            type: user.type,
            provider: user.provider,
            emailVerified: user.emailVerified,
          },
        },
        `${type[0].toUpperCase() + type.slice(1)} logged in successfully`
      )
    );
  } catch (error) {
    safeLogger.error("Login error", {
      message: error.message,
      stack: error.stack,
      email,
      type,
    });
    next(error);
  }
});

export const logoutUser = asyncHandler(async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      await authCache.blacklistToken(refreshToken);
      await authCache.removeUserSession(req.user.id, refreshToken);
    }

    safeLogger.info("User logged out successfully", {
      userId: req.user?.id,
      type: req.user?.type,
    });

    return res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            userId: req.user?.id,
          },
          `${req.user?.type} logout successfully`
        )
      );
  } catch (error) {
    safeLogger.error("Logout error", {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });
    next(error);
  }
});

export const verifyToken = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(401, "Token is missing");
  }

  try {
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);

    const user = await AuthUser.findOne({
      where: {
        id: decoded.id,
        email: decoded.email,
        isActive: true,
      },
    });

    if (!user) {
      throw new ApiError(401, "User not found or inactive");
    }

    safeLogger.info("Token verified successfully", {
      userId: user.id,
      type: user.type,
    });

    return res.status(200).json(
      new ApiResponse(200, "Token is valid", {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          type: user.type,
          role: user.role,
          provider: user.provider,
          linkedUserId: user.linkedUserId,
        },
      })
    );
  } catch (error) {
    safeLogger.error("Token verification error", {
      message: error.message,
      stack: error.stack,
    });
    throw new ApiError(401, "Invalid or expired token");
  }
});

export const refreshAccessToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req?.cookies;

  if (!refreshToken) {
    throw new ApiError(400, "Refresh token not found");
  }

  try {
    const decodedToken = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);

    if (!decodedToken) {
      throw new ApiError(400, "Refresh token not valid");
    }

    const user = await AuthUser.findByPk(decodedToken.id);

    if (!user || !user.isActive) {
      throw new ApiError(403, "User not found or inactive");
    }

    const accessToken = await user.generateAccessToken();

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000,
    });

    safeLogger.info("Access token refreshed successfully", {
      userId: user.id,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
  } catch (error) {
    next(error);
  }
});

export const getUserProfile = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "User not authenticated");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile retrieved successfully"));
});

export const loginWithGoogle = asyncHandler(async (req, res, next) => {
  const redirectUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${env.GOOGLE_REDIRECT_URI}` +
    `&response_type=code` +
    `&scope=email%20profile`;
  return res.redirect(redirectUrl);
});

export const googleCallback = asyncHandler(async (req, res, next) => {
  const { code } = req.query;

  if (!code) {
    throw new ApiError(400, "Authorization code is missing");
  }

  try {
    const tokenResponse = await axios.post(
      `https://oauth2.googleapis.com/token`,
      null,
      {
        params: {
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: env.GOOGLE_REDIRECT_URI,
          grant_type: "authorization_code",
          code,
        },
      }
    );

    const { access_token } = tokenResponse.data;

    const userInfoResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const userInfo = userInfoResponse.data;

    let user = await AuthUser.findOne({
      where: {
        email: userInfo.email,
        provider: "google",
        providerId: userInfo.id,
      },
    });

    if (!user) {
      let userId;
      try {
        const response = await axios.post(
          `${env.USER_SERVICE_URL}/user/create-profile`,
          {
            email: userInfo.email,
            type: "customer",
            fullName: userInfo.name,
          }
        );

        console.log("response", response.data);

        userId = response.data?.userId;
      } catch (error) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.error ||
            "Something went wrong while creating user profile"
        );
      }

      user = await AuthUser.create({
        email: userInfo.email,
        type: "customer",
        password: null,
        provider: "google",
        linkedUserId: userId,
        providerId: userInfo.id,
      });
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: {
            id: user.id,
            linkedUserId: user.linkedUserId,
            email: user.email,
            type: user.type,
            provider: user.provider,
            emailVerified: user.emailVerified,
          },
        },
        "Google login successful"
      )
    );
  } catch (error) {
    next(error);
  }
});
