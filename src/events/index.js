import rabbitMQConnection from "./connection.js";
import logger from "../config/logger.js";
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
// /**
//  * Events module entry point
//  *
//  * Initializes and exports RabbitMQ and gRPC components
//  */
// import logger from "../config/logger.js";

// // Import RabbitMQ connection and components
// import rabbitMQConnection from "./rabbitmq/connection.js";
// import emailVerificationPublisher from "./rabbitmq/publishers/emailVerification.publisher.js";
// import userCreatedPublisher from "./rabbitmq/publishers/userCreated.publisher.js";
// import userVerifiedConsumer from "./rabbitmq/consumers/userVerified.consumer.js";
// import accountDeletedConsumer from "./rabbitmq/consumers/accountDeleted.consumer.js";

// // Import gRPC components
// import grpcServer from "./grpc/server/index.js";
// import grpcClient from "./grpc/client/index.js";

// /**
//  * Initialize all event components
//  * @returns {Promise<void>}
//  */
// export const initializeEvents = async () => {
//   try {
//     logger.info("Initializing event components...");

//     // Initialize RabbitMQ connection
//     await rabbitMQConnection.init();

//     // Initialize RabbitMQ publishers
//     await emailVerificationPublisher.init();
//     await userCreatedPublisher.init();

//     // Initialize RabbitMQ consumers
//     await userVerifiedConsumer.init();
//     await accountDeletedConsumer.init();

//     // Initialize gRPC server
//     await grpcServer.start();

//     // Initialize gRPC clients
//     await grpcClient.init();

//     logger.info("All event components initialized successfully");
//   } catch (error) {
//     logger.error(`Failed to initialize event components: ${error.message}`);
//     throw error;
//   }
// };

// /**
//  * Gracefully shut down all event components
//  * @returns {Promise<void>}
//  */
// export const shutdownEvents = async () => {
//   try {
//     logger.info("Shutting down event components...");

//     // Stop RabbitMQ consumers
//     await userVerifiedConsumer.stop();
//     await accountDeletedConsumer.stop();

//     // Close RabbitMQ connection
//     await rabbitMQConnection.close();

//     // Stop gRPC server
//     await grpcServer.stop();

//     // Close gRPC clients
//     await grpcClient.close();

//     logger.info("All event components shut down successfully");
//   } catch (error) {
//     logger.error(`Error shutting down event components: ${error.message}`);
//     throw error;
//   }
// };

// // Export RabbitMQ components
// export const rabbitmq = {
//   connection: rabbitMQConnection,
//   publishers: {
//     emailVerification: emailVerificationPublisher,
//     userCreated: userCreatedPublisher,
//   },
//   consumers: {
//     userVerified: userVerifiedConsumer,
//     accountDeleted: accountDeletedConsumer,
//   },
// };

// // Export gRPC components
// export const grpc = {
//   server: grpcServer,
//   client: grpcClient,
// };

// export default {
//   initialize: initializeEvents,
//   shutdown: shutdownEvents,
//   rabbitmq,
//   grpc,
// };
