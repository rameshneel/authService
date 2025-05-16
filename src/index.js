import { env } from "./config/env.js";
import sequelize from "./db/index.js";
import { app } from "./app.js";
// import redisClient from "./config/redis.js";
// import { initializeRabbitMQ } from "./events/index.js";
// import grpcServer from "./grpc/index.js";

// async function initiateRedis() {
//   try {
//     await redisClient.init();
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }

// Initialize RabbitMQ and consumers
// grpcServer();
// initializeRabbitMQ();
// initiateRedis();

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
