import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { exportJWK } from "jose";
import fs from "fs";
import path from "path";
import { getAllPublicKeysMeta } from "../crypto/keyManager.js";
import { importSPKI } from "jose/key/import";

export const getJWKs = asyncHandler(async (req, res) => {
  try {
    const keysMeta = getAllPublicKeysMeta();
    const jwks = [];

    for (const { kid, public: publicPath } of keysMeta) {
      const publicPem = fs.readFileSync(
        path.join(process.cwd(), "keys", publicPath),
        "utf-8"
      );
      const publicKey = await importSPKI(publicPem, "RS256");
      const jwk = await exportJWK(publicKey);
      jwk.kid = kid;
      jwk.alg = "RS256";
      jwk.use = "sig";
      jwks.push(jwk);
    }

    console.log("✅ JWKs retrieved successfully", jwks.length, "keys found");

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({
      keys: jwks,
    });
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to retrieve JWKs");
  }
});
