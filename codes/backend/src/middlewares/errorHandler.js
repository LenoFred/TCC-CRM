/**
 * Error Handling Middleware
 * Centralized error handling for the entire application
 */

const { logger } = require('../utils/logger');
const config = require('../config');

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found (404) handler
 * Should be placed after all routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
};

/**
 * Global error handler
 * Should be placed at the end of middleware chain
 */
const errorHandler = (err, req, res, next) => {
  // Default to 500 if no status code is set
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error details
  if (statusCode >= 500) {
    logger.error('Server Error', {
      error: message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      params: req.params,
      query: req.query,
      userId: req.user?.userId,
      ip: req.ip,
    });
  } else {
    logger.warn('Client Error', {
      error: message,
      statusCode,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.userId,
    });
  }

  // Prepare error response
  const errorResponse = {
    error: message,
    statusCode,
  };

  // Add details if available (for validation errors, etc.)
  if (err.details) {
    errorResponse.details = err.details;
  }

  // Add stack trace in development mode
  if (config.server.isDevelopment && err.stack) {
    errorResponse.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 * Usage: router.get('/route', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error handler
 * Formats Zod validation errors
 */
const handleValidationError = (error) => {
  if (error.name === 'ZodError') {
    const details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return new ApiError('Validation failed', 400, details);
  }
  return error;
};

/**
 * Database error handler
 * Handles Google Sheets API errors
 */
const handleDatabaseError = (error) => {
  if (error.message && error.message.includes('Google Sheets')) {
    return new ApiError(
      'Database operation failed. Please try again.',
      503,
      config.server.isDevelopment ? error.message : null
    );
  }
  return error;
};

/**
 * Wrap error with ApiError if it's not already
 */
const wrapError = (error) => {
  if (error instanceof ApiError) {
    return error;
  }

  // Check for specific error types
  const validationError = handleValidationError(error);
  if (validationError instanceof ApiError) {
    return validationError;
  }

  const dbError = handleDatabaseError(error);
  if (dbError instanceof ApiError) {
    return dbError;
  }

  // Default to 500 Internal Server Error
  return new ApiError(
    config.server.isDevelopment ? error.message : 'Internal Server Error',
    500
  );
};

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler,
  asyncHandler,
  wrapError,
};
