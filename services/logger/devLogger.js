const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;

const formatMeta = meta => {
  const splat = meta[Symbol.for('splat')];

  if (splat && splat.length) {
    return `\n[metadata]: ${
      splat.length === 1
        ? JSON.stringify(splat)
        : splat.reduce((acc, val, idx) => {
            return acc + `\n${idx + 1}. ${JSON.stringify(val)}`;
          }, '')
    }`;
  }
  return '';
};

function createDevLogger() {
  const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const msg = `${timestamp} [${level}]: ${stack || message} ${formatMeta(
      meta,
    )}`;
    return msg;
  });

  return createLogger({
    level: 'debug',
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      devFormat,
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
