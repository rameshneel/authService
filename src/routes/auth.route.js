import { Router } from "express";
import {
  signupUser,
  loginUser,
  logoutUser,
  verifyToken,
  refreshAccessToken,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/logout", verifyJWT, logoutUser);

router.post("/verify-token", verifyToken);
router.get("/refresh-token", refreshAccessToken);
export default router;
