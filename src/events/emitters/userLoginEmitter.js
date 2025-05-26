import rabbitMQConnection from "../connection.js";
import logger from "../../config/logger.js";
import { rabbitMQConfig } from "../../config/rabbitMQ.js";

export async function publishUserLoginEvent(loginData) {
  try {
    const exchange = rabbitMQConfig.exchanges.auth.name;
    const routingKey = "user.login";
    await rabbitMQConnection.publish(
      "auth-channel",
      exchange,
      routingKey,
      loginData
    );
    logger.info(`Published user.login event for ${loginData.username}`);
  } catch (error) {
    logger.error("Failed to publish user.login event:", error);
    throw error;
  }
}
