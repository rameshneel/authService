import rabbitMQConnection from "../connection.js";
import logger from "../../config/logger.js";
import { rabbitMQConfig } from "../../config/rabbitMQ.js";

export async function publishUserCreatedEvent(userData) {
  try {
    const exchange = rabbitMQConfig.exchanges.auth.name;
    const routingKey = "user.created";
    await rabbitMQConnection.publish(
      "auth-channel",
      exchange,
      routingKey,
      userData
    );
    logger.info(`Published user.created event for ${userData.username}`);
  } catch (error) {
    logger.error("Failed to publish user.created event:", error);
    throw error;
  }
}
