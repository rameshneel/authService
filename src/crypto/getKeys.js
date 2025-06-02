import fs from "fs";
import path from "path";
import { importPKCS8, importSPKI } from "jose/key/import";
import { getCurrentKeyMeta } from "./keyManager.js";

export async function getPrivateKey() {
  const keyMeta = getCurrentKeyMeta();
  if (!keyMeta) throw new Error("No current private key found");
  const keyPath = path.join(process.cwd(), "keys", keyMeta.private);
  const privatePem = fs.readFileSync(keyPath, "utf-8");
  const pirvateKey = await importPKCS8(privatePem, "RS256");
  return { pirvateKey, kid: keyMeta.kid };
}

export async function getPublicKey() {
  const keyMeta = getCurrentKeyMeta();
  if (!keyMeta) throw new Error("No current public key found");
  const keyPath = path.join(process.cwd(), "keys", keyMeta.public);
  const publicPem = fs.readFileSync(keyPath, "utf-8");
  return await importSPKI(publicPem, "RS256");
}
