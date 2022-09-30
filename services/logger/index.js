const createDevLogger = require('./devLogger');
const createProdLogger = require('./prodLogger');

let logger;

if (logger === undefined) {
  logger =
    process.env.NODE_ENV === 'production'
      ? createProdLogger()
      : createDevLogger();
}

module.exports = logger;
