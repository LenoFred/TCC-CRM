/**
 * ID Generator Service
 * Generates unique, deterministic IDs with prefixes for each entity type
 * Format: PREFIX-TIMESTAMP-RANDOM
 * Example: MEM-20251101-A7B3C
 */

const crypto = require('crypto');

/**
 * Entity prefixes for ID generation
 */
const ID_PREFIXES = {
  MEMBER: 'MEM',
  FAMILY: 'FAM',
  GROUP: 'GRP',
  GROUP_MEMBER: 'GRM',
  EVENT: 'EVT',
  GATHERING: 'GATH',
  ATTENDANCE: 'ATT',
  DONATION: 'DON',
  VOLUNTEER_ROLE: 'VRL',
  VOLUNTEER_ASSIGNMENT: 'VAS',
  SUPPORT_REQUEST: 'SUP',
  STAFF: 'STF',
  STAFF_PERMISSION: 'PRM',
  BRANCH: 'BRN',
  COMMUNICATION: 'COM',
  GUEST: 'GST',
};

/**
 * Generates a random alphanumeric string
 * @param {number} length - Length of random string
 * @returns {string} Random string
 */
const generateRandomString = (length = 5) => {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
    .toUpperCase();
};

/**
 * Generates a date-based component for IDs
 * Format: YYYYMMDD
 * @returns {string} Date string
 */
const generateDateComponent = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * Generates a sequential number-based ID (legacy format support)
 * Format: PREFIX-XXX (e.g., FAM-001)
 * @param {string} prefix - Entity prefix
 * @param {number} nextNumber - Next sequential number
 * @param {number} padding - Number of digits to pad
 * @returns {string} Sequential ID
 */
const generateSequentialId = (prefix, nextNumber, padding = 3) => {
  return `${prefix}-${String(nextNumber).padStart(padding, '0')}`;
};

/**
 * Generates a unique ID with timestamp and random component
 * Format: PREFIX-YYYYMMDD-RANDOM
 * @param {string} entityType - Type of entity (must be key in ID_PREFIXES)
 * @returns {string} Generated ID
 */
const generateId = (entityType) => {
  const prefix = ID_PREFIXES[entityType];
  
  if (!prefix) {
    throw new Error(`Invalid entity type: ${entityType}. Must be one of: ${Object.keys(ID_PREFIXES).join(', ')}`);
  }

  const dateComponent = generateDateComponent();
  const randomComponent = generateRandomString(5);

  return `${prefix}-${dateComponent}-${randomComponent}`;
};

/**
 * Parses an ID to extract its components
 * @param {string} id - ID to parse
 * @returns {object} Parsed components {prefix, date, random}
 */
const parseId = (id) => {
  const parts = id.split('-');
  
  if (parts.length < 2) {
    return { prefix: parts[0], date: null, random: null, isLegacy: false };
  }

  // Check if it's a sequential (legacy) ID
  if (parts.length === 2 && !isNaN(parts[1])) {
    return {
      prefix: parts[0],
      sequence: parseInt(parts[1]),
      date: null,
      random: null,
      isLegacy: true,
    };
  }

  // Modern format: PREFIX-DATE-RANDOM
  return {
    prefix: parts[0],
    date: parts[1] || null,
    random: parts[2] || null,
    isLegacy: false,
  };
};

/**
 * Validates if an ID matches the expected format
 * @param {string} id - ID to validate
 * @param {string} entityType - Expected entity type
 * @returns {boolean} True if valid
 */
const validateId = (id, entityType) => {
  const expectedPrefix = ID_PREFIXES[entityType];
  
  if (!expectedPrefix) {
    return false;
  }

  const parsed = parseId(id);
  return parsed.prefix === expectedPrefix;
};

/**
 * Extracts the next sequential number from existing IDs
 * Used for legacy format support (e.g., FAM-001)
 * @param {Array<string>} existingIds - Array of existing IDs
 * @param {string} prefix - Entity prefix to match
 * @returns {number} Next sequential number
 */
const getNextSequentialNumber = (existingIds, prefix) => {
  if (!existingIds || existingIds.length === 0) {
    return 1;
  }

  const numbers = existingIds
    .filter(id => id && id.startsWith(prefix))
    .map(id => {
      const match = id.match(new RegExp(`^${prefix}-(\\d+)$`));
      return match ? parseInt(match[1]) : 0;
    })
    .filter(num => num > 0);

  return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
};

module.exports = {
  ID_PREFIXES,
  generateId,
  generateSequentialId,
  generateRandomString,
  generateDateComponent,
  parseId,
  validateId,
  getNextSequentialNumber,
};
