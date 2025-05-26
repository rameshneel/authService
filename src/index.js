import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./db/index.js";
import { logInfo, logError } from "./config/logger.js";

const start = async () => {
  try {
    await connectDB();
    logInfo("Database connected successfully");

    app.listen(env.PORT, () => {
      logInfo(`Server listening on port ${env.PORT}`);
    });

    app.on("error", (err) => {
      logError("Server encountered an error", err);
    });
  } catch (error) {
    logError("Something went wrong while initiating server", error);
    process.exit(1);
  }
};

start();
