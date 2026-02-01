/**
 * Data Formatting Utilities
 * Ensures consistent data formats for DOB, phone numbers, etc.
 */

/**
 * Convert various date formats to YYYY-MM-DD
 * Handles: DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, YYYY-MM-DD, timestamps, Date objects
 * 
 * @param {string|Date|number} dateInput - Date in any format
 * @returns {string|null} - Date in YYYY-MM-DD format or null if invalid
 */
function formatDateOfBirth(dateInput) {
  if (!dateInput) return null;

  try {
    let date;

    // If already in YYYY-MM-DD format, validate and return
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      date = new Date(dateInput);
      if (isNaN(date.getTime())) return null;
      return dateInput;
    }

    // Handle DD/MM/YYYY format
    if (typeof dateInput === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateInput)) {
      const [day, month, year] = dateInput.split('/');
      date = new Date(`${year}-${month}-${day}`);
    }
    // Handle MM/DD/YYYY format (ambiguous, but common in US)
    else if (typeof dateInput === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateInput)) {
      const parts = dateInput.split('/');
      // Assume MM/DD/YYYY if first part > 12, otherwise DD/MM/YYYY
      if (parseInt(parts[0]) > 12) {
        const [day, month, year] = parts;
        date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      } else {
        const [month, day, year] = parts;
        date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      }
    }
    // Handle DD-MM-YYYY format
    else if (typeof dateInput === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateInput)) {
      const [day, month, year] = dateInput.split('-');
      date = new Date(`${year}-${month}-${day}`);
    }
    // Handle timestamp or Date object
    else {
      date = new Date(dateInput);
    }

    // Validate date is valid
    if (isNaN(date.getTime())) {
      console.warn(`[DataFormatter] Invalid date: ${dateInput}`);
      return null;
    }

    // Validate date is reasonable for DOB (not in future, not too old)
    const now = new Date();
    const minDate = new Date('1900-01-01');
    if (date > now || date < minDate) {
      console.warn(`[DataFormatter] DOB out of reasonable range: ${dateInput}`);
      return null;
    }

    // Format to YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('[DataFormatter] Error formatting date:', error, dateInput);
    return null;
  }
}

/**
 * Format and validate phone number for Nigerian/international formats
 * Supports: +234, 0, international formats
 * Ensures compatibility with Twilio and other SMS providers
 * 
 * @param {string} phoneInput - Phone number in any format
 * @returns {Object} - { formatted: string, isValid: boolean, e164: string, display: string }
 */
function formatPhoneNumber(phoneInput) {
  if (!phoneInput) {
    return { formatted: null, isValid: false, e164: null, display: null };
  }

  try {
    // Remove all non-numeric characters except + at start
    let cleaned = phoneInput.toString().trim();
    const hasPlus = cleaned.startsWith('+');
    cleaned = cleaned.replace(/[^\d]/g, '');

    // Nigerian phone number patterns
    // Format 1: 08012345678 (11 digits starting with 0)
    // Format 2: 8012345678 (10 digits)
    // Format 3: +2348012345678 (with country code)
    // Format 4: 2348012345678 (country code without +)

    let e164Format; // International format for APIs (E.164)
    let displayFormat; // User-friendly format

    // Handle Nigerian numbers
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      // 08012345678 -> +2348012345678
      e164Format = `+234${cleaned.substring(1)}`;
      displayFormat = `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
    } else if (cleaned.length === 10 && !cleaned.startsWith('0')) {
      // 8012345678 -> +2348012345678
      e164Format = `+234${cleaned}`;
      displayFormat = `0${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    } else if (cleaned.length === 13 && cleaned.startsWith('234')) {
      // 2348012345678 -> +2348012345678
      e164Format = `+${cleaned}`;
      const localNumber = cleaned.substring(3);
      displayFormat = `0${localNumber.substring(0, 3)} ${localNumber.substring(3, 6)} ${localNumber.substring(6)}`;
    } else if (hasPlus && cleaned.length >= 10) {
      // International number with +
      e164Format = `+${cleaned}`;
      // Keep original display format for international
      displayFormat = phoneInput.trim();
    } else {
      // Invalid format
      return {
        formatted: phoneInput,
        isValid: false,
        e164: null,
        display: phoneInput,
        error: 'Invalid phone number format'
      };
    }

    // Validate E.164 format (max 15 digits including +)
    if (e164Format.length > 16) {
      return {
        formatted: phoneInput,
        isValid: false,
        e164: null,
        display: phoneInput,
        error: 'Phone number too long'
      };
    }

    // Validate against Twilio requirements
    const isValidForTwilio = /^\+[1-9]\d{1,14}$/.test(e164Format);

    return {
      formatted: e164Format, // For storing in database
      isValid: true,
      e164: e164Format, // For SMS/WhatsApp APIs (Twilio format)
      display: displayFormat, // For displaying to users
      isValidForTwilio,
    };
  } catch (error) {
    console.error('[DataFormatter] Error formatting phone:', error, phoneInput);
    return {
      formatted: phoneInput,
      isValid: false,
      e164: null,
      display: phoneInput,
      error: error.message
    };
  }
}

/**
 * Validate phone number for SMS/communications
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - True if valid for communications
 */
function isValidForCommunications(phoneNumber) {
  const result = formatPhoneNumber(phoneNumber);
  return result.isValid && result.isValidForTwilio;
}

/**
 * Batch format phone numbers
 * @param {Array<string>} phoneNumbers - Array of phone numbers
 * @returns {Array<Object>} - Array of formatted phone results
 */
function batchFormatPhoneNumbers(phoneNumbers) {
  return phoneNumbers.map(phone => formatPhoneNumber(phone));
}

/**
 * Extract valid phone numbers for bulk communications
 * @param {Array<Object>} members - Array of member objects
 * @returns {Array<Object>} - Members with valid phone numbers
 */
function extractValidPhoneNumbers(members) {
  return members
    .map(member => {
      const result = formatPhoneNumber(member.phoneNumber || member.phone);
      return {
        ...member,
        phoneFormatted: result.e164,
        phoneDisplay: result.display,
        phoneIsValid: result.isValid && result.isValidForTwilio,
      };
    })
    .filter(member => member.phoneIsValid);
}

module.exports = {
  formatDateOfBirth,
  formatPhoneNumber,
  isValidForCommunications,
  batchFormatPhoneNumbers,
  extractValidPhoneNumbers,
};
