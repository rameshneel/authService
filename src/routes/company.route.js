import { Router } from "express";
import {
  createProfile,
  createSuperAdmin,
} from "../controllers/company.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/profile/create", verifyJWT, createProfile);

//comment this route letter
router.post("/create-superadmin", createSuperAdmin);

export default router;
