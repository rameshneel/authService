import rabbitMQConnection from "../connection.js";
import { safeLogger } from "../../config/logger.js";
import { rabbitMQConfig } from "../../config/rabbitMQ.js";
import { ApiError } from "../../utils/ApiError.js";
import { getCorrelationId } from "../../config/requestContext.js";

export async function startUserVerifiedConsumer() {
  const correlationId = getCorrelationId();

  try {
    const queue = rabbitMQConfig.queues.userVerified.name;
    await rabbitMQConnection.consume(
      "auth-consumer-channel",
      queue,
      async (message, msg, channel) => {
        const msgCorrelationId = getCorrelationId();
        safeLogger.info("Received user.verified event", {
          message,
          correlationId: msgCorrelationId,
        });
        // Example: Update user verification status in AuthService DB
        // await updateUserVerificationStatus(message.userId, true);
      }
    );
    safeLogger.info("Started consumer for queue", {
      queue,
      correlationId,
    });
  } catch (error) {
    safeLogger.error("Failed to start user.verified consumer", {
      message: error.message,
      stack: error.stack,
      correlationId,
    });
    throw new ApiError(500, "Failed to start user.verified consumer", [
      error.message,
    ]);
  }
}
