import { asyncHandler } from "../utils/asyncHandler.js";
import AuthUser from "../models/authUser.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { authCache } from "../cache/auth.cache.js";
// import { createProfileSchemas } from "../validators/validation.js";
import { generate } from "generate-password";
import { safeLogger } from "../config/logger.js";
import { createUserProfile } from "../grpc/client/user.client.js";

export const createSuperAdmin = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const type = "company",
    role = "superadmin";

  try {
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      throw new ApiError(
        400,
        "All fields (name, email, password) are required"
      );
    }

    const existedSuperAdmin = await AuthUser.findOne({
      where: { email, type, role },
    });

    if (existedSuperAdmin) {
      throw new ApiError(400, `${role} already existed with this email...`);
    }

    let superadminData = {
      email,
      name,
      type,
      role,
    };

    const userResponse = await createUserProfile(superadminData);

    const { userId } = userResponse;

    if (!userResponse) {
      throw new ApiError(400, "failed to create superadmin");
    }

    const authSuperAdmin = await AuthUser.create({
      email,
      password,
      type,
      role,
      linkedUserId: userId,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "superadmin profile created successfully",
          authSuperAdmin
        )
      );
  } catch (error) {
    next(error);
  }
});

export const createProfile = asyncHandler(async (req, res, next) => {
  const { error, value } = createProfileSchemas(req.body);
  const {
    userId: loggedInUserId,
    role: loggedInUserRole,
    type: loggedInUserType,
  } = req.user;
  const type = "company";
  try {
    if (error) {
      const errorMessages = error.details.map((err) =>
        err.message.replace(/["]/g, "")
      );
      throw new ApiError(400, "Create Profile Validation error", errorMessages);
    }

    const { email, role, name } = value;
    let { password } = value;

    if (loggedInUserType !== "company" || loggedInUserRole === role) {
      throw new ApiError(400, "Access Denied");
    }

    const existedUser = await AuthUser.findOne({ where: { email } });
    if (existedUser) {
      throw new ApiError(400, `User already exists with this email.`);
    }

    if (!password || password == "") {
      password = generate({ numbers: true, length: 10 });
    }

    safeLogger.info("generating company profile");

    let userData = { email, name, role, type };
    let relationship = {
      reportsToId: loggedInUserId,
      reportsToRole: loggedInUserRole,
    };

    const userResponse = await createUserProfile(userData, relationship);

    if (!userResponse) {
      throw new ApiError(400, `Failed to create ${role} profile`);
    }

    const { userId } = userResponse;
    const authUser = await AuthUser.create({
      email,
      password,
      type,
      role,
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
          userId: parseInt(userId),
          email: authUser.email,
          type,
          role,
        },
        `${role} registered successfully`
      )
    );
  } catch (error) {
    next(error);
  }
});
