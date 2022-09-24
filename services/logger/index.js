const createDevLogger = require("./devLogger");
const createProdLogger = require("./prodLogger");

const logger =
  process.env.NODE_ENV === "production"
    ? createProdLogger()
    : createDevLogger();

module.exports = logger;
