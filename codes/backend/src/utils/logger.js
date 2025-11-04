/**
 * Logging Utility
 * Provides structured logging with different levels
 * Uses winston for production-grade logging
 */

const winston = require('winston');
const config = require('../config');

/**
 * Define log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  config.server.isDevelopment
    ? winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta, null, 2)}`;
          }
          return msg;
        })
      )
    : winston.format.json()
);

/**
 * Create logger instance
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'tcc-crm-backend' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: logFormat,
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

/**
 * Create logs directory if it doesn't exist
 */
const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Express middleware for request logging
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 400) {
      logger.error('HTTP Request Error', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

/**
 * Log API call to Google Sheets
 */
const logSheetsOperation = (operation, sheetName, details = {}) => {
  logger.debug('Google Sheets Operation', {
    operation,
    sheetName,
    ...details,
  });
};

/**
 * Log authentication events
 */
const logAuthEvent = (event, userId, details = {}) => {
  logger.info('Authentication Event', {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

/**
 * Log audit trail for important actions
 */
const logAudit = (action, userId, resourceType, resourceId, details = {}) => {
  logger.info('Audit Log', {
    action,
    userId,
    resourceType,
    resourceId,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

module.exports = {
  logger,
  requestLogger,
  logSheetsOperation,
  logAuthEvent,
  logAudit,
};
