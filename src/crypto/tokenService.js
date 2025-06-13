import { SignJWT } from "jose";
import { getPrivateKey } from "./getKeys.js";
import { env } from "../config/env.js";

export async function generateAccessToken(user) {
  const { pirvateKey, kid } = await getPrivateKey();
  const payload = {
    id: user.id,
    email: user.email,
    type: user.type,
    linkedUserId: user.linkedUserId,
    role: user.role,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", kid })
    .setExpirationTime(env.PRIVATE_KEY_EXIPRY)
    .sign(pirvateKey);

  return token;
}

export async function generateRefreshToken(user) {
  const payload = {
    id: user.id,
    type: user.type,
    linkedUserId: user.linkedUserId,
  };

  const secret = new TextEncoder().encode(env.REFRESH_TOKEN_SECRET);
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(env.REFRESH_TOKEN_EXPIRY)
    .sign(secret);

  return token;
}
