/**
 * Authentication Service
 * Handles user authentication, password hashing, and JWT token management
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const sheetsService = require('./sheetsService');
const { logger, logAuthEvent } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');

class AuthService {
  /**
   * Hash a password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(config.security.bcryptRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      logger.error('Error hashing password', { error: error.message });
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare password with hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} True if match
   */
  async comparePassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Error comparing password', { error: error.message });
      return false;
    }
  }

  /**
   * Generate JWT access token
   * @param {object} payload - Token payload (userId, email, role)
   * @returns {string} JWT token
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: 'tcc-crm',
      audience: 'tcc-crm-users',
    });
  }

  /**
   * Generate JWT refresh token
   * @param {object} payload - Token payload (userId)
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: 'tcc-crm',
      audience: 'tcc-crm-users',
    });
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token to verify
   * @returns {object} Decoded token payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret, {
        issuer: 'tcc-crm',
        audience: 'tcc-crm-users',
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw new Error('Token verification failed');
    }
  }

  /**
   * Decode token without verification (for extracting info)
   * @param {string} token - JWT token
   * @returns {object} Decoded token or null
   */
  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * Find staff member by email
   * @param {string} email - Staff email
   * @returns {Promise<object|null>} Staff object or null
   */
  async findStaffByEmail(email) {
    try {
      const staffData = await sheetsService.getSheetData(sheetsService.SHEETS.STAFF);
      
      if (staffData.length === 0) {
        return null;
      }

      const headers = staffData[0];
      const rows = staffData.slice(1);

      const emailIndex = headers.findIndex(h => 
        h.toLowerCase() === 'email' || h === 'Email'
      );

      if (emailIndex === -1) {
        throw new Error('Email column not found in Staff sheet');
      }

      const staffRow = rows.find(row => 
        row[emailIndex] && row[emailIndex].toLowerCase() === email.toLowerCase()
      );

      if (!staffRow) {
        return null;
      }

      // Convert to object
      const staff = {};
      headers.forEach((header, index) => {
        const camelKey = header.charAt(0).toLowerCase() + header.slice(1);
        staff[camelKey] = staffRow[index] || '';
      });

      return staff;
    } catch (error) {
      logger.error('Error finding staff by email', { error: error.message, email });
      throw error;
    }
  }

  /**
   * Find staff details by username in Details sheet
   * @param {string} username - Staff username
   * @returns {Promise<object|null>} Details object with staffID or null
   */
  async findDetailsByUsername(username) {
    try {
      const detailsData = await sheetsService.getSheetData(sheetsService.SHEETS.DETAILS);
      
      logger.info('Details sheet data retrieved', { 
        rowCount: detailsData.length,
        headers: detailsData.length > 0 ? detailsData[0] : [],
        username 
      });
      
      if (detailsData.length === 0) {
        logger.error('Details sheet is empty');
        return null;
      }

      const headers = detailsData[0];
      const rows = detailsData.slice(1);

      const usernameIndex = headers.findIndex(h => 
        h.toLowerCase() === 'username'
      );

      if (usernameIndex === -1) {
        logger.error('Username column not found in Details sheet', { headers });
        return null;
      }

      logger.info('Searching for username', { 
        username, 
        usernameIndex,
        availableUsernames: rows.map(r => r[usernameIndex]).filter(Boolean)
      });

      const detailsRow = rows.find(row => 
        row[usernameIndex] && row[usernameIndex].toLowerCase() === username.toLowerCase()
      );

      if (!detailsRow) {
        logger.error('Username not found in Details sheet', { 
          username,
          availableUsernames: rows.map(r => r[usernameIndex]).filter(Boolean)
        });
        return null;
      }

      // Convert to object
      const details = {};
      headers.forEach((header, index) => {
        const camelKey = header.charAt(0).toLowerCase() + header.slice(1);
        details[camelKey] = detailsRow[index] || '';
      });

      return details;
    } catch (error) {
      logger.error('Error finding details by username', { error: error.message, username });
      throw error;
    }
  }

  /**
   * Find staff member by staffID
   * @param {string} staffID - Staff ID
   * @returns {Promise<object|null>} Staff object or null
   */
  async findStaffById(staffID) {
    try {
      const staffData = await sheetsService.getSheetData(sheetsService.SHEETS.STAFF);
      
      if (staffData.length === 0) {
        return null;
      }

      const headers = staffData[0];
      const rows = staffData.slice(1);

      const staffIDIndex = headers.findIndex(h => 
        h.toLowerCase() === 'staffid'
      );

      if (staffIDIndex === -1) {
        logger.error('staffID column not found in Staff sheet');
        return null;
      }

      const staffRow = rows.find(row => 
        row[staffIDIndex] === staffID
      );

      if (!staffRow) {
        return null;
      }

      // Convert to object
      const staff = {};
      headers.forEach((header, index) => {
        const camelKey = header.charAt(0).toLowerCase() + header.slice(1);
        staff[camelKey] = staffRow[index] || '';
      });

      return staff;
    } catch (error) {
      logger.error('Error finding staff by ID', { error: error.message, staffID });
      throw error;
    }
  }

  /**
   * Update LastLogin timestamp for staff member
   * @param {string} staffID - Staff ID
   * @returns {Promise<void>}
   */
  async updateLastLogin(staffID) {
    try {
      // Update LastLogin with current timestamp using updateRow
      const now = new Date().toISOString();
      
      await sheetsService.updateRow(
        sheetsService.SHEETS.STAFF,
        'StaffID',
        staffID,
        { LastLogin: now }
      );

      logger.info('LastLogin updated', { staffID, timestamp: now });
    } catch (error) {
      logger.error('Error updating LastLogin', { error: error.message, staffID });
      // Don't throw - login should succeed even if LastLogin update fails
    }
  }

  /**
   * Get staff member with their member profile
   * @param {string} staffId - Staff ID
   * @returns {Promise<object|null>} Combined staff and member data
   */
  async getStaffWithMember(staffId) {
    try {
      const staffData = await sheetsService.getSheetData(sheetsService.SHEETS.STAFF);
      
      if (staffData.length === 0) {
        return null;
      }

      const headers = staffData[0];
      const rows = staffData.slice(1);

      const staffIdIndex = headers.findIndex(h => 
        h.toLowerCase() === 'staffid' || h === 'StaffID'
      );

      const staffRow = rows.find(row => row[staffIdIndex] === staffId);

      if (!staffRow) {
        return null;
      }

      // Convert to object
      const staff = {};
      headers.forEach((header, index) => {
        const camelKey = header.charAt(0).toLowerCase() + header.slice(1);
        staff[camelKey] = staffRow[index] || '';
      });

      // Fetch associated member profile
      if (staff.memberId || staff.memberID) {
        const members = await sheetsService.getMembers();
        const member = members.find(m => 
          m.memberId === staff.memberId || m.memberID === staff.memberID
        );
        
        if (member) {
          staff.memberProfile = member;
        }
      }

      return staff;
    } catch (error) {
      logger.error('Error getting staff with member', { error: error.message, staffId });
      throw error;
    }
  }

  /**
   * Get staff permissions from StaffPermissions sheet
   * @param {string} staffID - Staff ID from Staff sheet
   * @returns {Promise<Array<string>>} Array of permission keys
   */
  async getStaffPermissions(staffID) {
    try {
      const permissionsData = await sheetsService.getSheetData(
        sheetsService.SHEETS.STAFF_PERMISSIONS
      );

      if (permissionsData.length === 0) {
        return [];
      }

      const headers = permissionsData[0];
      const rows = permissionsData.slice(1);

      const staffIDIndex = headers.findIndex(h => 
        h.toLowerCase() === 'staffid'
      );
      const permissionKeyIndex = headers.findIndex(h => 
        h.toLowerCase() === 'permissionkey'
      );
      const hasAccessIndex = headers.findIndex(h => 
        h.toLowerCase() === 'hasaccess'
      );

      if (staffIDIndex === -1 || permissionKeyIndex === -1 || hasAccessIndex === -1) {
        logger.error('Required columns not found in StaffPermissions sheet');
        return [];
      }

      const permissions = rows
        .filter(row => 
          row[staffIDIndex] === staffID && 
          (row[hasAccessIndex] === 'TRUE' || row[hasAccessIndex] === 'true' || row[hasAccessIndex] === true)
        )
        .map(row => ({
          permissionKey: row[permissionKeyIndex],
          hasAccess: true
        }));

      logger.info('Staff permissions retrieved', { 
        staffID, 
        permissionsCount: permissions.length,
        permissions: permissions.map(p => p.permissionKey)
      });

      return permissions;
    } catch (error) {
      logger.error('Error getting staff permissions', { error: error.message, staffID });
      return [];
    }
  }

  /**
   * Authenticate user and generate tokens
   * @param {string} username - Username
   * @param {string} password - User password
   * @param {string} loginType - Login type ('Admin' or 'Staff')
   * @returns {Promise<object>} Authentication result with tokens and user data
   */
  async login(username, password, loginType) {
    try {
      // Find details by username (Details sheet contains username and password)
      const details = await this.findDetailsByUsername(username);

      if (!details) {
        logAuthEvent('LOGIN_FAILED', username, { reason: 'User not found' });
        throw new Error('Invalid username or password. Please check your credentials and try again.');
      }

      // Check if password field exists
      if (!details.password) {
        logAuthEvent('LOGIN_FAILED', username, { reason: 'No password set' });
        throw new Error('Account not properly configured. Please contact administrator.');
      }

      // Compare password
      const isPasswordValid = await this.comparePassword(password, details.password);

      if (!isPasswordValid) {
        logAuthEvent('LOGIN_FAILED', username, { reason: 'Invalid password' });
        throw new Error('Invalid username or password. Please check your credentials and try again.');
      }

      // Get staff information from Staff sheet using staffID
      const staff = await this.findStaffById(details.staffID);

      if (!staff) {
        logAuthEvent('LOGIN_FAILED', username, { reason: 'Staff record not found' });
        throw new Error('Account not properly configured. Please contact administrator.');
      }

      // Check if account is active
      if (staff.status && staff.status.toLowerCase() !== 'active') {
        logAuthEvent('LOGIN_FAILED', username, { reason: 'Inactive account' });
        throw new Error('Account is not active. Please contact administrator.');
      }

      // Validate loginType matches staff Role
      const userRole = staff.role || 'Staff';
      if (loginType && loginType !== userRole) {
        logAuthEvent('LOGIN_FAILED', username, { 
          reason: 'Role mismatch', 
          expectedRole: loginType, 
          actualRole: userRole 
        });
        const message = loginType === 'Admin' 
          ? 'You are not an Admin. Please use the Staff Login form.'
          : 'You are not a Staff member. Please use the Admin Login form.';
        throw new Error(message);
      }

      // Get staffID for permissions lookup
      const staffID = staff.staffID || staff.staffId;

      // Get permissions from StaffPermissions sheet
      const permissions = await this.getStaffPermissions(staffID);

      // Update LastLogin in Staff sheet
      await this.updateLastLogin(staffID);

      // Generate tokens - use role column from Staff sheet
      const tokenPayload = {
        userId: staffID,
        email: staff.email || '',
        role: staff.role || 'Staff', // Use role column from Staff sheet (Staff or Admin)
      };

      const accessToken = this.generateAccessToken(tokenPayload);
      const refreshToken = this.generateRefreshToken({ userId: tokenPayload.userId });

      logAuthEvent('LOGIN_SUCCESS', tokenPayload.userId, { username });

      // Return user data without password - include staffRole and fullName
      const { password: _, passwordHash: __, ...userWithoutPassword } = staff;

      return {
        success: true,
        accessToken,
        refreshToken,
        user: {
          ...userWithoutPassword,
          staffRole: staff.staffRole || staff.jobTitle || '',
          fullName: staff.fullName || `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
        },
        permissions, // Return permissions at top level for frontend
      };
    } catch (error) {
      logger.error('Login error', { error: error.message, username });
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Valid refresh token
   * @returns {Promise<object>} New access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = this.verifyToken(refreshToken);

      // Get staff data to generate new access token
      const staff = await this.getStaffWithMember(decoded.userId);

      if (!staff) {
        throw new Error('User not found');
      }

      // Check if account is still active
      if (staff.status && staff.status.toLowerCase() !== 'active') {
        throw new Error('Account is no longer active');
      }

      // Get staffID for permissions lookup
      const staffID = staff.staffID || staff.staffId;

      // Get permissions from StaffPermissions sheet
      const permissions = await this.getStaffPermissions(staffID);

      // Generate new access token - use role column from Staff sheet
      const tokenPayload = {
        userId: staffID,
        email: staff.email || '',
        role: staff.role || 'Staff', // Use role column from Staff sheet (Staff or Admin)
      };

      const accessToken = this.generateAccessToken(tokenPayload);

      logAuthEvent('TOKEN_REFRESHED', tokenPayload.userId);

      return {
        success: true,
        accessToken,
        user: staff,
        permissions, // Return permissions at top level for frontend
      };
    } catch (error) {
      logger.error('Token refresh error', { error: error.message });
      throw error;
    }
  }

  /**
   * Register a new staff member (admin only)
   * @param {object} staffData - Staff registration data
   * @returns {Promise<object>} Created staff member
   */
  async registerStaff(staffData) {
    try {
      const { email, password, firstName, lastName, jobTitle, memberId } = staffData;

      // Check if email already exists
      const existingStaff = await this.findStaffByEmail(email);
      if (existingStaff) {
        throw new Error('Email already registered');
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Generate staff ID
      const staffId = generateId('STAFF');

      // Prepare staff data
      const newStaff = {
        staffID: staffId,
        memberID: memberId || '',
        email,
        passwordHash,
        jobTitle: jobTitle || '',
        firstName: firstName || '',
        lastName: lastName || '',
        status: 'Active',
        appointmentDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };

      // Get headers from Staff sheet
      const staffSheetData = await sheetsService.getSheetData(sheetsService.SHEETS.STAFF);
      const headers = staffSheetData[0] || [
        'StaffID', 'MemberID', 'Email', 'PasswordHash', 'JobTitle', 
        'FirstName', 'LastName', 'Status', 'AppointmentDate', 'CreatedAt'
      ];

      // Create row
      const row = headers.map(header => {
        const camelKey = header.charAt(0).toLowerCase() + header.slice(1);
        return newStaff[camelKey] !== undefined ? newStaff[camelKey] : (newStaff[header] || '');
      });

      // Append to sheet
      await sheetsService.appendSheetData(sheetsService.SHEETS.STAFF, [row]);

      logAuthEvent('STAFF_REGISTERED', staffId, { email });

      // Return without password
      const { passwordHash: _, ...staffWithoutPassword } = newStaff;
      return staffWithoutPassword;
    } catch (error) {
      logger.error('Staff registration error', { error: error.message });
      throw error;
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const staff = await this.getStaffWithMember(userId);

      if (!staff) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.comparePassword(
        currentPassword,
        staff.passwordHash || staff.password
      );

      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Update in sheet
      await sheetsService.updateRow(
        sheetsService.SHEETS.STAFF,
        'StaffID',
        userId,
        { PasswordHash: newPasswordHash }
      );

      logAuthEvent('PASSWORD_CHANGED', userId);

      return true;
    } catch (error) {
      logger.error('Password change error', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Reset staff password (Admin only)
   * @param {string} staffId - Staff ID
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async resetStaffPassword(staffId, newPassword) {
    try {
      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Update password in Details sheet
      await sheetsService.updateRow(
        sheetsService.SHEETS.DETAILS || 'Details',
        'StaffID',
        staffId,
        { Password: newPasswordHash, UpdatedAt: new Date().toISOString() }
      );

      logAuthEvent('PASSWORD_RESET_BY_ADMIN', staffId);

      return true;
    } catch (error) {
      logger.error('Password reset error', { error: error.message, staffId });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new AuthService();
