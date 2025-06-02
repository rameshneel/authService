import { Router } from "express";
import { getJWKs } from "../controllers/jwk.controller.js";

const router = Router();

// Route to get JWKs
router.get("/.well-known/jwks.json", getJWKs);

export default router;
