const createDevLogger = require('./devLogger');
const createProdLogger = require('./prodLogger');

let logger;

if (logger === undefined) {
  logger =
    process.env.NODE_ENV === 'dev' ? createDevLogger() : createProdLogger();
}

module.exports = logger;
