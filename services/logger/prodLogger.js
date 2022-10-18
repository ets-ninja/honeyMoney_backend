const { createLogger, format, transports } = require('winston');
const { combine, timestamp, errors, json } = format;
const { Logtail } = require('@logtail/node');
const { LogtailTransport } = require('@logtail/winston');

const LOGTAIL_TOKEN = process.env.LOGTAIL_SOURCE_TOKEN;

const logtail = new Logtail(LOGTAIL_TOKEN);

function createProdLogger() {
  return createLogger({
    level: 'info',
    format: combine(timestamp(), errors({ stack: true }), json()),
    transports: [
      new transports.Console({
        handleExceptions: true,
        handleRejections: true,
      }),
      new LogtailTransport(logtail),
    ],
  });
}

module.exports = createProdLogger;
