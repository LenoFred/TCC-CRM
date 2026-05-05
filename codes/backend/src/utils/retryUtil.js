/**
 * Retry Utility with Exponential Backoff
 * Implements retry logic for API calls with configurable backoff strategy
 */

const { logger } = require('./logger');

/**
 * Executes a function with exponential backoff retry logic
 *
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Retry configuration
 *   - maxRetries: Maximum number of retry attempts (default: 3)
 *   - initialDelayMs: Initial delay in milliseconds (default: 1000)
 *   - maxDelayMs: Maximum delay cap in milliseconds (default: 30000)
 *   - backoffMultiplier: Multiplier for exponential backoff (default: 2)
 *   - retryableErrors: Array of error messages/codes to retry on
 * @param {string} operationName - Name of operation for logging
 * @returns {Promise} Result of function
 *
 * @example
 * const result = await retryWithBackoff(
 *   () => axios.post(url, data),
 *   { maxRetries: 3, initialDelayMs: 1000 },
 *   'Send SMS to BulkSMS Nigeria'
 * );
 */
async function retryWithBackoff(fn, options = {}, operationName = 'API Call') {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    retryableErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET', '429', '503', '502', '504']
  } = options;

  let lastError;
  let currentDelayMs = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      logger.info(`[Attempt ${attempt}/${maxRetries + 1}] ${operationName}`);
      const result = await fn();

      if (attempt > 1) {
        logger.info(`${operationName} succeeded on retry attempt ${attempt}`);
      }

      return result;
    } catch (error) {
      lastError = error;
      const errorCode = error.code || error.response?.status || error.message;
      const isRetryable = retryableErrors.some(code =>
        errorCode.toString().includes(code)
      );

      logger.warn(`[Attempt ${attempt}] ${operationName} failed`, {
        error: error.message,
        errorCode,
        isRetryable,
        retriesRemaining: maxRetries - attempt + 1
      });

      // If this was the last attempt or error is not retryable, throw
      if (attempt > maxRetries || !isRetryable) {
        logger.error(`${operationName} failed after ${attempt} attempt(s)`, {
          error: error.message,
          errorCode,
          totalAttempts: attempt
        });
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(currentDelayMs, maxDelayMs);
      logger.info(`Retrying ${operationName} in ${delay}ms...`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increase delay for next retry
      currentDelayMs *= backoffMultiplier;
    }
  }

  // This should not be reached due to throw above, but be explicit
  throw lastError;
}

/**
 * Check if error is a quota-related error
 * @param {Error} error - Error object to check
 * @returns {Object} { isQuotaError: boolean, retryAfterMs?: number }
 */
function isQuotaError(error) {
  const errorMessage = (error.message || '').toLowerCase();
  const errorCode = error.code || error.response?.status;
  const errorData = error.response?.data?.message || '';

  // Check for "quota" in error message
  if (errorMessage.includes('quota') || errorData.includes('quota')) {
    return {
      isQuotaError: true,
      type: 'quota',
      retryAfterMs: 60000 // Retry after 60 seconds
    };
  }

  // Check for "rate limit" or "too many requests" (429)
  if (errorCode === 429 || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    const retryAfter = error.response?.headers?.['retry-after'];
    return {
      isQuotaError: true,
      type: 'rate_limit',
      retryAfterMs: retryAfter ? parseInt(retryAfter) * 1000 : 62000
    };
  }

  // Check for specific API quota messages
  if (
    errorData.includes('quota exceeded') ||
    errorData.includes('read requests per minute') ||
    errorData.includes('queries per minute') ||
    errorData.includes('daily quota') ||
    errorData.includes('quota has been exceeded')
  ) {
    return {
      isQuotaError: true,
      type: 'api_quota',
      retryAfterMs: 120000 // Retry after 2 minutes for API quota
    };
  }

  return { isQuotaError: false };
}

/**
 * Check if error is transient (likely to succeed on retry)
 * @param {Error} error - Error object to check
 * @returns {boolean}
 */
function isTransientError(error) {
  const errorCode = error.code || error.response?.status;
  const transientCodes = [
    'ECONNREFUSED',      // Connection refused
    'ETIMEDOUT',         // Connection timeout
    'ECONNRESET',        // Connection reset
    'EHOSTUNREACH',      // Host unreachable
    '429',               // Too Many Requests
    '502',               // Bad Gateway
    '503',               // Service Unavailable
    '504'                // Gateway Timeout
  ];

  return transientCodes.some(code =>
    errorCode?.toString().includes(code)
  );
}

module.exports = {
  retryWithBackoff,
  isQuotaError,
  isTransientError
};
