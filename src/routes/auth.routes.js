import express from "express";
import {
  signup,
  login,
  googleAuth,
  googleCallback,
  verifyToken,
  forgotPassword,
  resetPassword,
  logout,
  changePassword,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.post("/verify-token", verifyToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);
router.post("/change-password", changePassword);

export default router;
