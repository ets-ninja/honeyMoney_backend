const morgan = require("morgan");
const logger = require("../services/logger");

const stream = {
  write: (message) => logger.http(message),
};

const morganMiddleware = morgan("dev", { stream });

module.exports = morganMiddleware;
