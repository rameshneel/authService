import rabbitMQConnection from "./connection.js";
import { safeLogger } from "../config/logger.js";
import { startUserVerifiedConsumer } from "./consumers/userVerifiedConsumer.js";
import { ApiError } from "../utils/ApiError.js";
import { getCorrelationId } from "../config/requestContext.js";

export async function initializeRabbitMQ() {
  const correlationId = getCorrelationId();

  try {
    // Initialize RabbitMQ connection
    await rabbitMQConnection.init();
    safeLogger.info("RabbitMQ connection initialized", { correlationId });

    // Start consumers
    await startUserVerifiedConsumer();
    safeLogger.info("All consumers started", { correlationId });
  } catch (error) {
    safeLogger.error("Failed to initialize events", {
      message: error.message,
      stack: error.stack,
      correlationId,
    });
    throw new ApiError(500, "Failed to initialize events", [error.message]);
  }
}
