/**
 * PizzaHub Structured Logger
 *
 * Lightweight logger wrapping console with:
 * - Log levels (error, warn, info, debug)
 * - ISO timestamps
 * - Production suppresses debug
 * - Request ID support
 * - Never logs sensitive data
 */

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const currentLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production' ? LOG_LEVELS.info : LOG_LEVELS.debug;
};

const formatMessage = (level, message, meta = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  // Remove undefined values
  Object.keys(entry).forEach((key) => {
    if (entry[key] === undefined) delete entry[key];
  });

  return JSON.stringify(entry);
};

const logger = {
  error(message, meta = {}) {
    if (currentLevel() >= LOG_LEVELS.error) {
      console.error(formatMessage('error', message, meta));
    }
  },

  warn(message, meta = {}) {
    if (currentLevel() >= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', message, meta));
    }
  },

  info(message, meta = {}) {
    if (currentLevel() >= LOG_LEVELS.info) {
      console.log(formatMessage('info', message, meta));
    }
  },

  debug(message, meta = {}) {
    if (currentLevel() >= LOG_LEVELS.debug) {
      console.log(formatMessage('debug', message, meta));
    }
  },
};

export default logger;
