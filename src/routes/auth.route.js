import { Router } from "express";
import {
  signupUser,
  loginUser,
  logoutUser,
  verifyToken,
  refreshAccessToken,
  getUserProfile,
  loginWithGoogle,
  googleCallback,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/logout", verifyJWT, logoutUser);

router.get("/login/google", loginWithGoogle);
// router.get("/google/callback", googleCallback);

router.post("/verify-token", verifyToken);
router.get("/refresh-token", refreshAccessToken);
router.get("/get-user", verifyJWT, getUserProfile);

export default router;
