const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, colorize, errors } = format;

function createDevLogger() {
  const devFormat = printf(
    ({ level, message, timestamp, stack, ...metadata }) => {
      const msg = `${timestamp} [${level}]: ${stack || message}`;
      return msg;
    }
  );

  return createLogger({
    level: "debug",
    format: combine(
      colorize(),
      timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      errors({ stack: true }),
      devFormat
    ),
    transports: [
      new transports.Console({
        handleExceptions: true,
        handleRejections: true,
      }),
    ],
  });
}

module.exports = createDevLogger;
