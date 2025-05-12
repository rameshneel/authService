import dotenv from "dotenv";
import sequelize from "./db/index.js";
import { app } from "./app.js";
import redisClient from "./config/redis.js";
import { initializeRabbitMQ } from "./events/index.js";
import grpcServer from "./grpc/index.js";
dotenv.config({
  path: "./.env",
});

async function testRedis() {
  try {
    await redisClient.init();
  } catch (error) {
    console.error("Error:", error);
  }
}

// Initialize RabbitMQ and consumers
grpcServer();
initializeRabbitMQ();
testRedis();

// Sync without dropping tables (no data loss)
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("✔️ Tables synchronized successfully!");

    // Authenticate DB connection and start the server
    sequelize
      .authenticate()
      .then(() => {
        app.listen(process.env.PORT || 8900, () => {
          console.log(
            `⚙️ Server is running at port : ${process.env.PORT || 8900}`
          );
        });
      })
      .catch((err) => {
        console.log("❌ MySQL db connection failed: ", err);
      });
  })
  .catch((err) => {
    console.log("❌ Error synchronizing tables: ", err);
  });
