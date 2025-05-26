import rabbitMQConnection from "../connection.js";
import logger from "../../config/logger.js";
import { rabbitMQConfig } from "../../config/rabbitMQ.js";

export async function startUserVerifiedConsumer() {
  try {
    const queue = rabbitMQConfig.queues.userVerified.name;
    await rabbitMQConnection.consume(
      "auth-consumer-channel",
      queue,
      async (message, msg, channel) => {
        logger.info("Received user.verified event:", message);
        // Example: Update user verification status in AuthService DB
        // await updateUserVerificationStatus(message.userId, true);
      }
    );
    logger.info(`Started consumer for ${queue}`);
  } catch (error) {
    logger.error("Failed to start user.verified consumer:", error);
    throw error;
  }
}
