import { env } from "./config/env.js";
import sequelize from "./db/index.js";
import { app } from "./app.js";
import { initializeRabbitMQ } from "./events/index.js";
import initializeGrpcServices from "./grpc/index.js";

// Test Redis connection
const testRedisConnection = async () => {
  try {
    await redis.ping();
    console.log("Redis connection test successful");
  } catch (error) {
    console.error("Redis connection test failed:", error.message);
  }
};

// Initialize RabbitMQ and consumers
// await initializeGrpcServices();
// await initializeRabbitMQ();
// await testRedisConnection();

// Sync without dropping tables (no data loss)
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("✔️ Tables synchronized successfully!");

    // Authenticate DB connection and start the server
    sequelize
      .authenticate()
      .then(() => {
        app.listen(env.PORT, () => {
          console.log(`⚙️ Server is running at port : ${env.PORT}`);
        });
      })
      .catch((err) => {
        console.log("❌ MySQL db connection failed: ", err);
        process.exit(1);
      });
  })
  .catch((err) => {
    console.log("❌ Error synchronizing tables: ", err);
    process.exit(1);
  });
