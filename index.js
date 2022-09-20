const express = require("express");
const cors = require("cors");
require("dotenv").config();

const morganMiddleware = require("./middlewares/morgan.middleware");
const logger = require("./services/logger");

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());
app.use(morganMiddleware);

const server = app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
});
