/**
 * Socket.IO Server
 *
 * This module initializes and configures the Socket.IO server
 */
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import socketConfig from "../config/socketIo.js";
import redisClient from "../config/redis.js";
import logger from "../config/logger.js";
import authMiddleware from "./middleware/auth.middleware.js";
import rateLimitMiddleware from "./middleware/rateLimit.middleware.js";
import loggingMiddleware from "./middleware/logging.middleware.js";
import authHandlers from "./handlers/auth.handlers.js";
import notificationHandlers from "./handlers/notification.handlers.js";
import { validateMessage } from "./validators/message.validator.js";

class SocketServer {
  constructor() {
    this.io = null;
    this.namespaces = new Map();
  }

  /**
   * Initialize Socket.IO server
   * @param {Object} httpServer - HTTP server instance
   * @returns {Object} Socket.IO server instance
   */
  init(httpServer) {
    if (this.io) {
      return this.io;
    }

    logger.info("Initializing Socket.IO server...");

    // Create Socket.IO server
    this.io = new Server(httpServer, socketConfig.options);

    // Setup Redis adapter if enabled
    this._setupRedisAdapter();

    // Setup middleware
    this._setupMiddleware();

    // Setup namespaces
    this._setupNamespaces();

    logger.info("Socket.IO server initialized successfully");
    return this.io;
  }

  /**
   * Set up Redis adapter for Socket.IO
   * @private
   */
  async _setupRedisAdapter() {
    if (!socketConfig.adapter.enabled) {
      logger.info("Socket.IO Redis adapter disabled");
      return;
    }

    try {
      logger.info("Setting up Socket.IO Redis adapter...");

      // Ensure Redis client is initialized
      await redisClient.init();

      // Create Redis adapter
      const pubClient = redisClient.getClient().duplicate();
      const subClient = redisClient.getClient().duplicate();

      // Wait for connections
      await Promise.all([pubClient.connect(), subClient.connect()]);

      // Create adapter
      this.io.adapter(
        createAdapter(pubClient, subClient, {
          key: socketConfig.adapter.prefix,
          requestsTimeout: socketConfig.adapter.requestsTimeout,
        })
      );

      logger.info("Socket.IO Redis adapter set up successfully");
    } catch (error) {
      logger.error(
        `Failed to set up Socket.IO Redis adapter: ${error.message}`
      );
      // Continue without Redis adapter
      logger.info("Continuing without Socket.IO Redis adapter");
    }
  }

  /**
   * Set up global middleware
   * @private
   */
  _setupMiddleware() {
    logger.info("Setting up Socket.IO middleware...");

    // Add global middleware
    if (socketConfig.middleware.logging.enabled) {
      this.io.use(loggingMiddleware);
    }

    if (socketConfig.middleware.rateLimiting.enabled) {
      this.io.use(rateLimitMiddleware);
    }

    logger.info("Socket.IO global middleware set up successfully");
  }

  /**
   * Set up namespaces
   * @private
   */
  _setupNamespaces() {
    logger.info("Setting up Socket.IO namespaces...");

    // Set up main namespace
    this._setupMainNamespace();

    // Set up auth namespace
    this._setupAuthNamespace();

    // Set up notifications namespace
    this._setupNotificationsNamespace();

    logger.info("Socket.IO namespaces set up successfully");
  }

  /**
   * Set up main namespace
   * @private
   */
  _setupMainNamespace() {
    const namespace = this.io.of(socketConfig.namespaces.main);

    // Store namespace reference
    this.namespaces.set("main", namespace);

    // Set up connection handler
    namespace.on("connection", (socket) => {
      logger.info(`New connection on main namespace: ${socket.id}`);

      // Handle disconnection
      socket.on("disconnect", () => {
        logger.info(`Client disconnected from main namespace: ${socket.id}`);
      });

      // Handle errors
      socket.on("error", (error) => {
        logger.error(`Socket error on main namespace: ${error.message}`);
      });
    });
  }

  /**
   * Set up auth namespace
   * @private
   */
  _setupAuthNamespace() {
    const namespace = this.io.of(socketConfig.namespaces.auth);

    // Store namespace reference
    this.namespaces.set("auth", namespace);

    // Apply auth middleware
    namespace.use(authMiddleware);

    // Set up connection handler
    namespace.on("connection", (socket) => {
      logger.info(`New connection on auth namespace: ${socket.id}`);

      // Register auth event handlers
      authHandlers.register(socket);

      // Handle disconnection
      socket.on("disconnect", () => {
        logger.info(`Client disconnected from auth namespace: ${socket.id}`);
      });
    });
  }

  /**
   * Set up notifications namespace
   * @private
   */
  _setupNotificationsNamespace() {
    const namespace = this.io.of(socketConfig.namespaces.notifications);

    // Store namespace reference
    this.namespaces.set("notifications", namespace);

    // Apply auth middleware
    namespace.use(authMiddleware);

    // Set up connection handler
    namespace.on("connection", (socket) => {
      logger.info(`New connection on notifications namespace: ${socket.id}`);

      // Register notification event handlers
      notificationHandlers.register(socket);

      // Handle disconnection
      socket.on("disconnect", () => {
        logger.info(
          `Client disconnected from notifications namespace: ${socket.id}`
        );
      });
    });
  }

  /**
   * Get namespace by name
   * @param {string} name - Namespace name
   * @returns {Object} Socket.IO namespace
   */
  getNamespace(name) {
    return this.namespaces.get(name);
  }

  /**
   * Broadcast message to all clients in a namespace
   * @param {string} namespace - Namespace name
   * @param {string} event - Event name
   * @param {Object} data - Message data
   */
  broadcast(namespace, event, data) {
    const ns = this.getNamespace(namespace);
    if (!ns) {
      logger.error(`Namespace not found: ${namespace}`);
      return;
    }

    if (!validateMessage(data)) {
      logger.error("Invalid message data");
      return;
    }

    ns.emit(event, data);
  }
}

// Export singleton instance
export default new SocketServer();
// Handle
