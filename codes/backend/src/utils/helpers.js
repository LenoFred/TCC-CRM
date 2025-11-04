/**
 * Helper Utilities
 * Common utility functions used across the application
 */

/**
 * Safely parse JSON string
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed object or default value
 */
const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Paginate an array of data
 * @param {Array} data - Data to paginate
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {object} Paginated data with metadata
 */
const paginate = (data, page = 1, limit = 10) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  
  return {
    data: data.slice(startIndex, endIndex),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: data.length,
      totalPages: Math.ceil(data.length / limitNum),
      hasNext: endIndex < data.length,
      hasPrev: pageNum > 1,
    },
  };
};

/**
 * Filter data by search term across multiple fields
 * @param {Array} data - Data to filter
 * @param {string} searchTerm - Search term
 * @param {Array<string>} searchFields - Fields to search in
 * @returns {Array} Filtered data
 */
const searchFilter = (data, searchTerm, searchFields = []) => {
  if (!searchTerm || !searchTerm.trim()) {
    return data;
  }

  const term = searchTerm.toLowerCase().trim();
  
  return data.filter(item =>
    searchFields.some(field => {
      const value = getNestedValue(item, field);
      return value && value.toString().toLowerCase().includes(term);
    })
  );
};

/**
 * Get nested object value by dot notation path
 * @param {object} obj - Object to search
 * @param {string} path - Dot notation path (e.g., 'user.address.city')
 * @returns {*} Value at path or undefined
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Convert array of arrays (Google Sheets format) to array of objects
 * @param {Array<Array>} data - Sheet data with headers in first row
 * @returns {Array<object>} Array of objects
 */
const sheetsToObjects = (data) => {
  if (!data || data.length === 0) {
    return [];
  }

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      // Convert header to camelCase
      const camelKey = header.charAt(0).toLowerCase() + header.slice(1);
      obj[camelKey] = row[index] || '';
    });
    return obj;
  });
};

/**
 * Convert object to array format for Google Sheets
 * @param {object} obj - Object to convert
 * @param {Array<string>} headers - Sheet headers
 * @returns {Array} Row data
 */
const objectToSheetRow = (obj, headers) => {
  return headers.map(header => {
    // Convert PascalCase header to camelCase key
    const camelKey = header.charAt(0).toLowerCase() + header.slice(1);
    return obj[camelKey] !== undefined ? obj[camelKey] : (obj[header] || '');
  });
};

/**
 * Sanitize string input to prevent injection
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
};

/**
 * Generate a random alphanumeric code
 * @param {number} length - Length of code
 * @returns {string} Random code
 */
const generateCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Format date to YYYY-MM-DD
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
const formatDate = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Format datetime to ISO string
 * @param {Date|string} date - Date to format
 * @returns {string} ISO datetime string
 */
const formatDateTime = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  return d.toISOString();
};

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
const isEmpty = (value) => {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  );
};

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Sleep for specified milliseconds (useful for testing/retries)
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after sleep
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry a function multiple times on failure
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} Result of function
 */
const retry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await sleep(delay * (i + 1)); // Exponential backoff
      }
    }
  }
  
  throw lastError;
};

module.exports = {
  safeJsonParse,
  paginate,
  searchFilter,
  getNestedValue,
  sheetsToObjects,
  objectToSheetRow,
  sanitizeString,
  generateCode,
  formatDate,
  formatDateTime,
  isEmpty,
  deepClone,
  sleep,
  retry,
};
