import { env } from "./env.js";
import logger from "./logger.js";

const socketConfig = {
  options: {
    // CORS configuration
    cors: {
      origin: env.SOCKET_CORS_ORIGIN?.split(",") || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    allowUpgrades: true,
    transports: ["websocket", "polling"],

    // Ping timeout and interval
    pingTimeout: 30000, // 30 seconds
    pingInterval: 25000, // 25 seconds

    // Path for Socket.IO
    path: env.SOCKET_PATH || "/socket.io",

    // Connection timeout
    connectTimeout: 45000, // 45 seconds

    // Maximum number of HTTP buffered events
    maxHttpBufferSize: 1e6, // 1MB

    // Number of packets a client can send in a given amount of time
    connectionStateRecovery: {
      // the backup duration of the sessions and the packets
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      // whether to skip middlewares upon successful recovery
      skipMiddlewares: true,
    },

    // Enable WebSocket permessage-deflate compression
    perMessageDeflate: {
      threshold: 1024, // only compress messages larger than 1KB
    },
  },

  // Redis adapter configuration (for horizontal scaling)
  adapter:
    env.SOCKET_REDIS_ADAPTER === "true"
      ? {
          enabled: true,
          host: env.SOCKET_REDIS_HOST || "localhost",
          port: parseInt(env.SOCKET_REDIS_PORT || "6379", 10),
          username: env.SOCKET_REDIS_USERNAME,
          password: env.SOCKET_REDIS_PASSWORD,
          prefix: "socket.io",
          requestsTimeout: 5000,
        }
      : {
          enabled: false,
        },

  // Namespace configuration
  namespaces: {
    main: "/",
    auth: "/auth",
    notifications: "/notifications",
  },

  // Event names
  events: {
    // Client-to-server events
    client: {
      AUTHENTICATE: "authenticate",
      LOGOUT: "logout",
      JOIN_ROOM: "join_room",
      LEAVE_ROOM: "leave_room",
      REQUEST_VERIFICATION: "request_verification",
      VERIFY_CODE: "verify_code",
      SUBSCRIBE_USER_UPDATES: "subscribe_user_updates",
    },

    // Server-to-client events
    server: {
      AUTHENTICATION_SUCCESS: "authentication_success",
      AUTHENTICATION_FAILED: "authentication_failed",
      USER_UPDATED: "user_updated",
      VERIFICATION_SENT: "verification_sent",
      VERIFICATION_SUCCESS: "verification_success",
      VERIFICATION_FAILED: "verification_failed",
      SESSION_EXPIRED: "session_expired",
      ERROR: "error",
    },

    // Internal events (not exposed to clients)
    internal: {
      USER_CREATED: "user_created",
      USER_UPDATED: "user_updated",
      USER_DELETED: "user_deleted",
      SESSION_CREATED: "session_created",
      SESSION_EXPIRED: "session_expired",
    },
  },

  // Room prefixes
  rooms: {
    userPrefix: "user:",
    adminPrefix: "admin:",
    verificationPrefix: "verification:",
  },

  // Middleware settings
  middleware: {
    authentication: {
      enabled: true,
      excludeNamespaces: ["/", "/public"],
      excludeEvents: ["authenticate", "health"],
    },

    rateLimiting: {
      enabled: true,
      points: 100, // Number of points
      duration: 60, // Per 60 seconds
      blockDuration: 60, // Block for 60 seconds if exceeded
    },

    logging: {
      enabled: true,
      level: "info",
      events: true,
      connections: true,
    },
  },
};

export default socketConfig;
