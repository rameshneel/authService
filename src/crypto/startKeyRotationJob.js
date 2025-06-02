import cron from "node-cron";
import { rotateKeys } from "./keyManager.js";
import ms from "ms";
import { env } from "../config/env.js";

export async function startKeyRotationJob() {
  await rotateKeys();

  console.log("🔄 Starting JWT key rotation job...");

  const rotationMs = ms(env.KEY_ROTATION_TIME);
  const rotationMinutes = Math.max(Math.floor(rotationMs / 60000), 1);

  const cronExp = `*/${rotationMinutes} * * * *`;
  cron.schedule(cronExp, async () => {
    console.log("🔄 Rotating JWT keys...");
    await rotateKeys();
  });
}
