import { asyncHandler } from "../utils/asyncHandler.js";
import AuthUser from "../models/authUser.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { signupSchemas, commonLoginSchema } from "../validators/validation.js";
import { env } from "../config/env.js";
import { authCache } from "../cache/auth.cache.js";
import { createUserProfile, getUserById } from "../grpc/client/user.client.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../crypto/tokenService.js";
import { safeLogger } from "../config/logger.js";

const generateTokens = async (user) => {
  try {
    const accessToken = await generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate tokens", error);
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
  const { error, value } = signupSchemas(req.body);

  if (error) {
    const errorMessages = error.details.map((err) =>
      err.message.replace(/["]/g, "")
    );
    throw new ApiError(400, "Validation error", errorMessages);
  }

  const { fullName, email, password, type, role } = value;

  const existingUser = await AuthUser.findOne({ where: { email, type } });
  if (existingUser) {
    throw new ApiError(400, `${type} already exists with this email`);
  }

  const userData = {
    fullName,
    email,
    type,
    role,
  };

  try {
    const userResponse = await createUserProfile(userData);

    if (!userResponse) {
      throw new ApiError(400, "Failed to create user profile");
    }

    const { userId } = userResponse;
    const authUser = await AuthUser.create({
      fullName,
      email,
      password,
      type,
      role,
      userId,
    });

    if (!authUser) {
      throw new ApiError(400, "Failed to create auth user");
      // delete user profile event
    }

    safeLogger.info("User registered successfully", {
      userId,
      authId: authUser.id,
      fullName,
      type,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          authId: authUser.id,
          email,
          fullName,
          type,
        },
        `${type} registered successfully`
      )
    );
  } catch (error) {
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

    // const sessionData = {
    //   userId: user.id,
    //   email: user.email,
    //   type: user.type,
    //   lastActive: new Date().toISOString(),
    // };

    // await authCache.storeUserSession(user.id, sessionData);
    // await authCache.addUserSession(user.id, refreshToken);

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

    const { name, userId } = userResponse;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          token: accessToken,
          user: {
            id: parseInt(userId),
            name,
            email: user.email,
            type: user.type,
            linkedUserId: user.linkedUserId,
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

    // if (refreshToken) {
    //   await authCache.blacklistToken(refreshToken);
    //   await authCache.removeUserSession(req.user.id, refreshToken);
    // }

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

    const accessToken = await generateAccessToken(user);

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
        const response = await createUserProfile({
          email: userInfo.email,
          type: "customer",
          name: userInfo.name,
        });

        console.log("response", response);

        userId = response.userId;
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
