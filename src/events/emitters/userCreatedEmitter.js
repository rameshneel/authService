import rabbitMQConnection from "../connection.js";
import { safeLogger } from "../../config/logger.js";
import { rabbitMQConfig } from "../../config/rabbitMQ.js";
import { ApiError } from "../../utils/ApiError.js";
import { getCorrelationId } from "../../config/requestContext.js";

export async function publishUserCreatedEvent(userData) {
  const correlationId = getCorrelationId();

  try {
    const exchange = rabbitMQConfig.exchanges.auth.name;
    const routingKey = "user.created";
    await rabbitMQConnection.publish(
      "auth-channel",
      exchange,
      routingKey,
      userData
    );
    safeLogger.info("Published user.created event", {
      username: userData.username,
      correlationId,
    });
  } catch (error) {
    safeLogger.error("Failed to publish user.created event", {
      message: error.message,
      stack: error.stack,
      userData,
      correlationId,
    });
    throw new ApiError(500, "Failed to publish user.created event", [
      error.message,
    ]);
  }
}
