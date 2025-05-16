import { asyncHandler } from "../utils/asyncHandler.js";
import axios from "axios";
import AuthUser from "../models/authuser.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { signupSchemas, commonLoginSchema } from "../validators/validation.js";
import { env } from "../config/env.js";
import jwt from "jsonwebtoken";

export const generateTokens = async (user) => {
  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();
  return { accessToken, refreshToken };
};

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  path: "/",
  domain: process.env.COOKIE_DOMAIN || undefined,
};

export const signupUser = asyncHandler(async (req, res, next) => {
  const { type } = req.body;
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

  // Call User Service to create profile
  const { data, status } = await axios.post(
    `${env.USER_SERVICE_URL}/user/create-profile`,
    {
      email,
      type,
      ...profileData,
    }
  );

  if (status === 500) {
    throw new ApiError(500, "something went wrong while sending axios request");
  }

  const { userId } = data;

  const authUser = await AuthUser.create({
    email,
    password,
    type,
    linkedUserId: userId,
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
});

//login
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

    const isPasswordValid = await user.isValidPassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid email or password");
    }

    const { accessToken, refreshToken } = await generateTokens(user);

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
          user: {
            id: user.id,
            linkedUserId: user.linkedUserId,
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
    next(error);
  }
});

export const logoutUser = asyncHandler(async (req, res, next) => {
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
});

export const verifyToken = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(401, "token is missing");
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
    throw new ApiError(401, "Invalid or expired token");
  }
});

export const refreshAccessToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req?.cookies;

  if (!refreshToken) {
    throw new ApiError(400, "refresh token not found");
  }

  try {
    const decodedToken = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);

    if (!decodedToken) {
      throw new ApiError(400, "refresh token not valid");
    }

    const user = await AuthUser.findByPk(decodedToken.id);

    if (!user || !user.isActive) {
      throw new ApiError(403, "User not found or inactive");
    }

    const accessToken = user.generateAccessToken();

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Refresh token expired");
    }
    next(error);
  }
});
