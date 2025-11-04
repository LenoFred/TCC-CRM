/**
 * Enhanced Google Sheets Service
 * Provides data access layer for Google Sheets with caching, retry logic, and error handling
 */

const { google } = require('googleapis');
const NodeCache = require('node-cache');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { logger, logSheetsOperation } = require('../utils/logger');
const { retry, sheetsToObjects, objectToSheetRow } = require('../utils/helpers');

class SheetsService {
  constructor() {
    this.spreadsheetId = config.googleSheets.spreadsheetId;
    this.auth = null;
    this.sheets = null;
    
    // Initialize cache
    this.cache = new NodeCache({
      stdTTL: config.cache.ttl,
      checkperiod: config.cache.checkPeriod,
      useClones: false, // Better performance for large datasets
    });

    // Sheet names mapping (matching data schema)
    this.SHEETS = {
      MEMBERS: 'Members',
      FAMILIES: 'Families',
      GROUPS: 'Groups',
      GROUP_MEMBERS: 'GroupMembers',
      EVENTS: 'Events',
      GATHERINGS: 'Gatherings',
      ATTENDANCE: 'Attendance',
      DONATIONS: 'Donations',
      VOLUNTEER_ROLES: 'VolunteerRoles',
      VOLUNTEER_ASSIGNMENTS: 'VolunteerAssignments',
      SUPPORT_REQUESTS: 'SupportRequests',
      STAFF: 'Staff',
      STAFF_PERMISSIONS: 'StaffPermissions',
      BRANCHES: 'Branches',
      COMMUNICATIONS: 'Communications',
      SETTINGS: 'Settings',
    };

    this.initializeAuth();
  }

  /**
   * Initialize Google Sheets authentication
   */
  async initializeAuth() {
    try {
      const credentialsPath = path.isAbsolute(config.googleSheets.credentialsPath)
        ? config.googleSheets.credentialsPath
        : path.join(__dirname, '../../', config.googleSheets.credentialsPath);

      if (!fs.existsSync(credentialsPath)) {
        throw new Error(`Credentials file not found at: ${credentialsPath}`);
      }

      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      logger.info('Google Sheets authentication initialized successfully');
    } catch (error) {
      logger.error('Error initializing Google Sheets auth', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate cache key for a sheet
   */
  getCacheKey(sheetName, range = 'all') {
    return `${sheetName}:${range}`;
  }

  /**
   * Get data from a sheet with caching
   * @param {string} sheetName - Name of the sheet
   * @param {string} range - A1 notation range (default: A:Z)
   * @param {boolean} useCache - Whether to use cache
   * @returns {Promise<Array>} Sheet data as array of arrays
   */
  async getSheetData(sheetName, range = 'A:Z', useCache = true) {
    const cacheKey = this.getCacheKey(sheetName, range);

    // Check cache first
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logSheetsOperation('READ_CACHE_HIT', sheetName, { range });
        return cached;
      }
    }

    // Fetch from Google Sheets with retry logic
    const fetchData = async () => {
      if (!this.sheets) await this.initializeAuth();

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!${range}`,
      });

      return response.data.values || [];
    };

    try {
      const data = await retry(fetchData, 3, 1000);
      
      // Cache the result
      if (useCache) {
        this.cache.set(cacheKey, data);
      }

      logSheetsOperation('READ', sheetName, { range, rowCount: data.length });
      return data;
    } catch (error) {
      logger.error(`Error reading from ${sheetName}`, { error: error.message, range });
      throw new Error(`Failed to read from ${sheetName}: ${error.message}`);
    }
  }

  /**
   * Get sheet data as array of objects
   * @param {string} sheetName - Name of the sheet
   * @param {boolean} useCache - Whether to use cache
   * @returns {Promise<Array<object>>} Sheet data as array of objects
   */
  async getSheetObjects(sheetName, useCache = true) {
    const data = await this.getSheetData(sheetName, 'A:Z', useCache);
    return sheetsToObjects(data);
  }

  /**
   * Update entire sheet data
   * @param {string} sheetName - Name of the sheet
   * @param {Array<Array>} data - Data to write
   * @param {string} range - A1 notation range
   * @returns {Promise<object>} Update response
   */
  async updateSheetData(sheetName, data, range = 'A1') {
    const updateData = async () => {
      if (!this.sheets) await this.initializeAuth();

      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!${range}`,
        valueInputOption: 'RAW',
        resource: { values: data },
      });

      return response.data;
    };

    try {
      const result = await retry(updateData, 3, 1000);
      
      // Invalidate cache for this sheet
      this.invalidateCache(sheetName);
      
      logSheetsOperation('UPDATE', sheetName, { range, rowCount: data.length });
      return result;
    } catch (error) {
      logger.error(`Error updating ${sheetName}`, { error: error.message, range });
      throw new Error(`Failed to update ${sheetName}: ${error.message}`);
    }
  }

  /**
   * Append data to sheet
   * @param {string} sheetName - Name of the sheet
   * @param {Array<Array>} data - Data to append
   * @returns {Promise<object>} Append response
   */
  async appendSheetData(sheetName, data) {
    const appendData = async () => {
      if (!this.sheets) await this.initializeAuth();

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'RAW',
        resource: { values: data },
      });

      return response.data;
    };

    try {
      const result = await retry(appendData, 3, 1000);
      
      // Invalidate cache for this sheet
      this.invalidateCache(sheetName);
      
      logSheetsOperation('APPEND', sheetName, { rowCount: data.length });
      return result;
    } catch (error) {
      logger.error(`Error appending to ${sheetName}`, { error: error.message });
      throw new Error(`Failed to append to ${sheetName}: ${error.message}`);
    }
  }

  /**
   * Batch get multiple ranges
   * @param {Array<string>} ranges - Array of ranges in format "SheetName!A1:Z100"
   * @returns {Promise<Array>} Array of range data
   */
  async batchGet(ranges) {
    try {
      if (!this.sheets) await this.initializeAuth();

      const response = await this.sheets.spreadsheets.values.batchGet({
        spreadsheetId: this.spreadsheetId,
        ranges: ranges,
      });

      logSheetsOperation('BATCH_GET', 'Multiple', { rangeCount: ranges.length });
      return response.data.valueRanges;
    } catch (error) {
      logger.error('Error in batch get', { error: error.message });
      throw new Error(`Batch get failed: ${error.message}`);
    }
  }

  /**
   * Batch update multiple ranges
   * @param {Array<object>} updates - Array of update objects
   * @returns {Promise<object>} Batch update response
   */
  async batchUpdate(updates) {
    try {
      if (!this.sheets) await this.initializeAuth();

      const response = await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          valueInputOption: 'RAW',
          data: updates,
        },
      });

      // Invalidate all caches
      this.cache.flushAll();
      
      logSheetsOperation('BATCH_UPDATE', 'Multiple', { updateCount: updates.length });
      return response.data;
    } catch (error) {
      logger.error('Error in batch update', { error: error.message });
      throw new Error(`Batch update failed: ${error.message}`);
    }
  }

  /**
   * Invalidate cache for a specific sheet or all caches
   * @param {string} sheetName - Name of sheet to invalidate (optional)
   */
  invalidateCache(sheetName = null) {
    if (sheetName) {
      const keys = this.cache.keys().filter(key => key.startsWith(sheetName));
      this.cache.del(keys);
      logger.debug(`Cache invalidated for ${sheetName}`);
    } else {
      this.cache.flushAll();
      logger.debug('All caches invalidated');
    }
  }

  /**
   * Find row index by matching a column value
   * @param {string} sheetName - Name of the sheet
   * @param {string} column - Column name to match
   * @param {*} value - Value to find
   * @returns {Promise<number>} Row index (0-based, excluding header) or -1
   */
  async findRowIndex(sheetName, column, value) {
    const objects = await this.getSheetObjects(sheetName);
    return objects.findIndex(obj => obj[column] === value);
  }

  /**
   * Update a specific row by matching a column value
   * @param {string} sheetName - Name of the sheet
   * @param {string} matchColumn - Column to match
   * @param {*} matchValue - Value to match
   * @param {object} updates - Object with column:value pairs to update
   * @returns {Promise<boolean>} True if updated, false if not found
   */
  async updateRow(sheetName, matchColumn, matchValue, updates) {
    const data = await this.getSheetData(sheetName);
    
    if (data.length === 0) {
      return false;
    }

    const headers = data[0];
    const rows = data.slice(1);
    const matchIndex = headers.indexOf(matchColumn);

    if (matchIndex === -1) {
      throw new Error(`Column ${matchColumn} not found in ${sheetName}`);
    }

    const rowIndex = rows.findIndex(row => row[matchIndex] === matchValue);

    if (rowIndex === -1) {
      return false;
    }

    // Apply updates
    headers.forEach((header, index) => {
      const camelKey = header.charAt(0).toLowerCase() + header.slice(1);
      if (updates[header] !== undefined) {
        rows[rowIndex][index] = updates[header];
      } else if (updates[camelKey] !== undefined) {
        rows[rowIndex][index] = updates[camelKey];
      }
    });

    // Write back to sheet
    await this.updateSheetData(sheetName, [headers, ...rows]);
    return true;
  }

  // ============================================
  // Convenience methods for each sheet
  // ============================================

  async getMembers(useCache = true) {
    return this.getSheetObjects(this.SHEETS.MEMBERS, useCache);
  }

  async getFamilies(useCache = true) {
    return this.getSheetObjects(this.SHEETS.FAMILIES, useCache);
  }

  async getGroups(useCache = true) {
    return this.getSheetObjects(this.SHEETS.GROUPS, useCache);
  }

  async getGroupMembers(useCache = true) {
    return this.getSheetObjects(this.SHEETS.GROUP_MEMBERS, useCache);
  }

  async getEvents(useCache = true) {
    return this.getSheetObjects(this.SHEETS.EVENTS, useCache);
  }

  async getGatherings(useCache = true) {
    return this.getSheetObjects(this.SHEETS.GATHERINGS, useCache);
  }

  async getAttendance(useCache = true) {
    return this.getSheetObjects(this.SHEETS.ATTENDANCE, useCache);
  }

  async getDonations(useCache = true) {
    return this.getSheetObjects(this.SHEETS.DONATIONS, useCache);
  }

  async getVolunteerRoles(useCache = true) {
    return this.getSheetObjects(this.SHEETS.VOLUNTEER_ROLES, useCache);
  }

  async getVolunteerAssignments(useCache = true) {
    return this.getSheetObjects(this.SHEETS.VOLUNTEER_ASSIGNMENTS, useCache);
  }

  async getSupportRequests(useCache = true) {
    return this.getSheetObjects(this.SHEETS.SUPPORT_REQUESTS, useCache);
  }

  async getStaff(useCache = true) {
    return this.getSheetObjects(this.SHEETS.STAFF, useCache);
  }

  async getStaffPermissions(useCache = true) {
    return this.getSheetObjects(this.SHEETS.STAFF_PERMISSIONS, useCache);
  }

  async getBranches(useCache = true) {
    return this.getSheetObjects(this.SHEETS.BRANCHES, useCache);
  }

  async getCommunications(useCache = true) {
    return this.getSheetObjects(this.SHEETS.COMMUNICATIONS, useCache);
  }

  async getSettings(useCache = true) {
    return this.getSheetObjects(this.SHEETS.SETTINGS, useCache);
  }
}

// Export singleton instance
module.exports = new SheetsService();
