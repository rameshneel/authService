import fs from "fs";
import path from "path";
import { generateKeyPair } from "jose";
import { exportPKCS8, exportSPKI } from "jose";
import ms from "ms";
import { env } from "../config/env.js";

const KEYS_DIR = path.join(process.cwd(), "keys");
const KEYS_JSON = path.join(KEYS_DIR, "keys.json");

function loadKeysMeta() {
  if (!fs.existsSync(KEYS_JSON)) return { current: null, keys: [] };
  return JSON.parse(fs.readFileSync(KEYS_JSON, "utf-8"));
}

function saveKeysMeta(meta) {
  fs.writeFileSync(KEYS_JSON, JSON.stringify(meta, null, 2));
}

export function getCurrentKeyMeta() {
  const meta = loadKeysMeta();
  return meta.keys.find((k) => k.kid === meta.current);
}

export function getAllPublicKeysMeta() {
  const meta = loadKeysMeta();
  return meta.keys.map((k) => ({ kid: k.kid, public: k.public }));
}

function hasValidCurrentKey() {
  if (!fs.existsSync(KEYS_JSON)) return false;
  const meta = JSON.parse(fs.readFileSync(KEYS_JSON, "utf-8"));
  if (!meta.current) return false;
  const currentKey = meta.keys.find((k) => k.kid === meta.current);
  if (!currentKey) return false;
  // Check if not expired
  return new Date(currentKey.expiresAt).getTime() > Date.now();
}

export async function rotateKeys() {
  if (hasValidCurrentKey()) {
    console.log("✅ Valid current key exists. Skipping key generation.");
    return;
  }
  console.log("🔄 Generating new JWT keys...");
  const now = new Date();
  const kid =
    now
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 12) + "Z";
  const privatePath = `${kid}_private.pem`;
  const publicPath = `${kid}_public.pem`;

  const { publicKey, privateKey } = await generateKeyPair("RS256", {
    modulusLength: 2048,
    extractable: true,
  });
  const privatePem = await exportPKCS8(privateKey);
  const publicPem = await exportSPKI(publicKey);

  fs.mkdirSync(KEYS_DIR, { recursive: true });
  fs.writeFileSync(path.join(KEYS_DIR, privatePath), privatePem);
  fs.writeFileSync(path.join(KEYS_DIR, publicPath), publicPem);

  const meta = loadKeysMeta();
  const createdAt = now.toISOString();
  const retentionMs = ms(env.PRIVATE_KEY_RETENTION) || 60 * 60 * 1000;
  const expiresAt = new Date(now.getTime() + retentionMs).toISOString();

  meta.keys.push({
    kid,
    private: privatePath,
    public: publicPath,
    createdAt,
    expiresAt,
  });
  meta.current = kid;

  saveKeysMeta(meta);
}
