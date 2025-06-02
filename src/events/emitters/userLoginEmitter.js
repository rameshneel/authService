import rabbitMQConnection from "../connection.js";
import { safeLogger } from "../../config/logger.js";
import { rabbitMQConfig } from "../../config/rabbitMQ.js";
import { ApiError } from "../../utils/ApiError.js";
import { getCorrelationId } from "../../config/requestContext.js";

export async function publishUserLoginEvent(loginData) {
  const correlationId = getCorrelationId();

  try {
    const exchange = rabbitMQConfig.exchanges.auth.name;
    const routingKey = "user.login";
    await rabbitMQConnection.publish(
      "auth-channel",
      exchange,
      routingKey,
      loginData
    );
    safeLogger.info("Published user.login event", {
      username: loginData.username,
      correlationId,
    });
  } catch (error) {
    safeLogger.error("Failed to publish user.login event", {
      message: error.message,
      stack: error.stack,
      loginData,
      correlationId,
    });
    throw new ApiError(500, "Failed to publish user.login event", [
      error.message,
    ]);
  }
}
