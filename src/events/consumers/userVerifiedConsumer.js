import rabbitMQConnection from "../connection.js";
import { safeLogger } from "../../config/logger.js";
import { rabbitMQConfig } from "../../config/rabbitMQ.js";
import { ApiError } from "../../utils/ApiError.js";

export async function startUserVerifiedConsumer() {
  try {
    const queue = rabbitMQConfig.queues.userVerified.name;
    await rabbitMQConnection.consume(
      "auth-consumer-channel",
      queue,
      async (message, msg, channel) => {
        safeLogger.info("Received user.verified event", {
          message,
        });
        // Example: Update user verification status in AuthServ ice DB
        // await updateUserVerificationStatus(message.userId, true);
      }
    );
    safeLogger.info("Started consumer for queue", {
      queue,
    });
  } catch (error) {
    safeLogger.error("Failed to start user.verified consumer", {
      message: error.message,
      stack: error.stack,
    });
    throw new ApiError(500, "Failed to start user.verified consumer", [
      error.message,
    ]);
  }
}
