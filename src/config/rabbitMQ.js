import { env } from "./env.js";

const EXCHANGE_TYPES = {
  DIRECT: "direct",
  FANOUT: "fanout",
  TOPIC: "topic",
  HEADERS: "headers",
};

// Validate environment variables
if (!env.RABBITMQ_URL) {
  throw new Error("RABBITMQ_URL is required in .env file");
}

// Configuration object with default values
const rabbitMQConfig = {
  // Connection URL
  url: env.RABBITMQ_URL,

  // Connection options
  connectionOptions: {
    heartbeat: 60, // Heartbeat interval in seconds
    timeout: 30000, // Connection timeout in milliseconds
  },

  // Exchange configurations
  exchanges: {
    auth: {
      name: "auth_exchange",
      type: EXCHANGE_TYPES.DIRECT, // Direct exchange for point-to-point
      options: {
        durable: true,
        autoDelete: false,
      },
    },
    notifications: {
      name: "notifications_exchange",
      type: EXCHANGE_TYPES.FANOUT,
      options: {
        durable: true,
        autoDelete: false,
      },
    },
  },

  // Queue configurations
  queues: {
    userCreated: {
      name: "user_created_queue",
      options: {
        durable: true,
        deadLetterExchange: "auth_dlx",
        messageTtl: 86400000, // 24 hours
      },
      bindings: [
        {
          exchange: "auth_exchange",
          routingKey: "user.created",
        },
      ],
    },
    emailVerification: {
      name: "email_verification_queue",
      options: {
        durable: true,
        deadLetterExchange: "auth_dlx",
        messageTtl: 86400000, // 24 hours
      },
      bindings: [
        {
          exchange: "auth_exchange",
          routingKey: "email.verification",
        },
      ],
    },
    userVerified: {
      name: "user_verified_queue",
      options: {
        durable: true,
        deadLetterExchange: "auth_dlx",
        messageTtl: 86400000, // 24 hours
      },
      bindings: [
        {
          exchange: "auth_exchange",
          routingKey: "user.verified",
        },
      ],
    },
  },

  // Consumer options
  consumerOptions: {
    prefetch: 10, // Number of messages to prefetch
    noAck: false, // Manual acknowledgments
  },

  // Dead letter exchange
  deadLetterExchange: {
    name: "auth_dlx",
    type: EXCHANGE_TYPES.DIRECT,
    queue: "auth_dlq",
    routingKey: "failed.auth",
    queueOptions: {
      durable: true,
      messageTtl: 604800000, // 7 days for DLQ
    },
  },

  // Retry mechanism configuration
  retryMechanism: {
    maxRetries: 3,
    initialInterval: 1000, // 1 second
    multiplier: 2, // Exponential backoff
  },
};

export { rabbitMQConfig, EXCHANGE_TYPES };
export default rabbitMQConfig;
