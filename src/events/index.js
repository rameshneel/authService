import rabbitMQConnection from "./connection.js";
import { logger } from "../config/logger.js";
import { startUserVerifiedConsumer } from "./consumers/userVerifiedConsumer.js";

export async function initializeRabbitMQ() {
  try {
    // Initialize RabbitMQ connection
    await rabbitMQConnection.init();
    logger.info("RabbitMQ connection initialized");

    // Start consumers
    await startUserVerifiedConsumer();
    logger.info("All consumers started");
  } catch (error) {
    logger.error("Failed to initialize events:", error);
    throw error;
  }
}
