const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

require("dotenv").config();

const morganMiddleware = require("./middlewares/morgan.middleware");
const logger = require("./services/logger");

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL;
const app = express();

mongoose.connection.on("open", () => {
  logger.info("MongoDB connected");
});

mongoose.connection.on("error", (err) => {
  logger.error(err);
});

app.use(cors());
app.use(express.json());
app.use(morganMiddleware);

async function startServer() {
  await mongoose.connect(MONGO_URL);

  app.listen(PORT, (err) => {
    if (err) {
      logger.error(err);
      return;
    }
    logger.info(`Server listens on port ${PORT}`);
  });
}

startServer();
