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

router.route("/signup").post(signupUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/login/google").get(loginWithGoogle);
router.route("/google/callback").get(googleCallback);

router.route("/verify-token").post(verifyToken);
router.route("/refresh-token").get(refreshAccessToken);
router.route("/get-user").get(verifyJWT, getUserProfile);

router.get("/protected", verifyJWT, (req, res) => {
  res.status(200).json({
    message: "Protected route accessed successfully",
    user: req.user,
  });
});

export default router;
