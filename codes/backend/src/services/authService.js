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
   * Get staff permissions
   * @param {string} staffMemberId - Staff's member ID
   * @returns {Promise<Array<string>>} Array of permission keys
   */
  async getStaffPermissions(staffMemberId) {
    try {
      const permissionsData = await sheetsService.getSheetData(
        sheetsService.SHEETS.STAFF_PERMISSIONS
      );

      if (permissionsData.length === 0) {
        return [];
      }

      const headers = permissionsData[0];
      const rows = permissionsData.slice(1);

      const staffMemberIdIndex = headers.findIndex(h => 
        h.toLowerCase() === 'staffmemberid' || h === 'StaffMemberID'
      );
      const permissionKeyIndex = headers.findIndex(h => 
        h.toLowerCase() === 'permissionkey' || h === 'PermissionKey'
      );
      const hasAccessIndex = headers.findIndex(h => 
        h.toLowerCase() === 'hasaccess' || h === 'HasAccess'
      );

      const permissions = rows
        .filter(row => 
          row[staffMemberIdIndex] === staffMemberId && 
          (row[hasAccessIndex] === 'TRUE' || row[hasAccessIndex] === 'true' || row[hasAccessIndex] === true)
        )
        .map(row => row[permissionKeyIndex]);

      return permissions;
    } catch (error) {
      logger.error('Error getting staff permissions', { error: error.message, staffMemberId });
      return [];
    }
  }

  /**
   * Authenticate user and generate tokens
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} Authentication result with tokens and user data
   */
  async login(email, password) {
    try {
      // Find staff by email
      const staff = await this.findStaffByEmail(email);

      if (!staff) {
        logAuthEvent('LOGIN_FAILED', email, { reason: 'User not found' });
        throw new Error('Invalid email or password');
      }

      // Check if password field exists
      if (!staff.password && !staff.passwordHash) {
        logAuthEvent('LOGIN_FAILED', email, { reason: 'No password set' });
        throw new Error('Account not properly configured. Please contact administrator.');
      }

      // Compare password
      const passwordHash = staff.passwordHash || staff.password;
      const isPasswordValid = await this.comparePassword(password, passwordHash);

      if (!isPasswordValid) {
        logAuthEvent('LOGIN_FAILED', email, { reason: 'Invalid password' });
        throw new Error('Invalid email or password');
      }

      // Check if account is active
      if (staff.status && staff.status.toLowerCase() !== 'active') {
        logAuthEvent('LOGIN_FAILED', email, { reason: 'Inactive account' });
        throw new Error('Account is not active. Please contact administrator.');
      }

      // Get permissions
      const permissions = await this.getStaffPermissions(staff.memberId || staff.memberID);

      // Generate tokens
      const tokenPayload = {
        userId: staff.staffId || staff.staffID || staff.id,
        email: staff.email,
        memberId: staff.memberId || staff.memberID,
        role: staff.jobTitle || staff.position || 'staff',
      };

      const accessToken = this.generateAccessToken(tokenPayload);
      const refreshToken = this.generateRefreshToken({ userId: tokenPayload.userId });

      logAuthEvent('LOGIN_SUCCESS', tokenPayload.userId, { email });

      // Return user data without password
      const { password: _, passwordHash: __, ...userWithoutPassword } = staff;

      return {
        success: true,
        accessToken,
        refreshToken,
        user: {
          ...userWithoutPassword,
          permissions,
        },
      };
    } catch (error) {
      logger.error('Login error', { error: error.message, email });
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

      // Get permissions
      const permissions = await this.getStaffPermissions(staff.memberId || staff.memberID);

      // Generate new access token
      const tokenPayload = {
        userId: staff.staffId || staff.staffID || staff.id,
        email: staff.email,
        memberId: staff.memberId || staff.memberID,
        role: staff.jobTitle || staff.position || 'staff',
      };

      const accessToken = this.generateAccessToken(tokenPayload);

      logAuthEvent('TOKEN_REFRESHED', tokenPayload.userId);

      return {
        success: true,
        accessToken,
        user: {
          ...staff,
          permissions,
        },
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
}

// Export singleton instance
module.exports = new AuthService();
