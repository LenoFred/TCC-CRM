/**
 * Group Permissions Middleware
 * Validates staff access to specific groups
 */

const { logger } = require('../utils/logger');
const { ApiError } = require('./errorHandler');

/**
 * Get staff's group permissions from request user object
 * @param {object} req - Express request object
 * @returns {Array<string>|null} Array of group IDs or null for admin/all access
 */
const getStaffGroupPermissions = (req) => {
  // Check if user is admin (admins bypass all restrictions)
  if (req.user?.role?.toLowerCase() === 'admin') {
    logger.debug('Admin user detected - bypassing group restrictions', { userId: req.user.userId });
    return null; // null = full access for admin
  }

  // Get group permissions from token (set by authenticate middleware)
  const groupPermissions = req.user?.groupPermissions;

  // null or undefined = no restrictions (full access)
  if (groupPermissions === null || groupPermissions === undefined) {
    logger.debug('No group restrictions - full access', { userId: req.user?.userId });
    return null;
  }

  // Empty array = no specific groups selected, give full access (no filtering)
  if (Array.isArray(groupPermissions) && groupPermissions.length === 0) {
    logger.debug('Empty group permissions array - full access', { userId: req.user?.userId });
    return null; // Full access if no groups specified in restrictions
  }

  // Return the array of permitted group IDs
  logger.debug('Group restrictions active', { userId: req.user?.userId, groups: groupPermissions });
  return groupPermissions;
};

/**
 * Middleware to check if staff has access to specific group
 * Usage: router.get('/groups/:id', authenticate, requireGroupAccess, (req, res) => { ... })
 */
const requireGroupAccess = async (req, res, next) => {
  try {
    // Extract staff ID from authenticated user
    const staffId = req.user?.memberId || req.user?.staffId || req.user?.userId;

    if (!staffId) {
      // If no staff ID (e.g., auth disabled in dev), allow all access
      logger.warn('No staff ID found in request - allowing access (auth may be disabled)');
      return next();
    }

    // Get group ID from request (params, body, or query)
    const groupId = req.params.id || req.params.groupId || req.body.groupId || req.query.groupId;

    if (!groupId) {
      // No specific group being accessed, let controller handle filtering
      return next();
    }

    // Get staff's permitted groups from token
    const permittedGroups = getStaffGroupPermissions(req);

    // null = full access (admin or no restrictions)
    if (permittedGroups === null) {
      return next();
    }

    // Check if staff has access to this specific group
    if (!permittedGroups.includes(groupId)) {
      // Get user's accessible groups for error context
      let groupsList = 'No groups assigned';
      if (Array.isArray(permittedGroups) && permittedGroups.length > 0) {
        try {
          const sheetsService = require('../services/sheetsService');
          const groups = await sheetsService.getSheetObjects(sheetsService.SHEETS.GROUPS);
          const groupNames = groups
            .filter(g => permittedGroups.includes(g.groupID))
            .map(g => g.groupName)
            .join(', ');
          groupsList = groupNames || permittedGroups.join(', ');
        } catch (error) {
          groupsList = permittedGroups.join(', ');
        }
      }
      throw new ApiError(403, `You don't have access to this group. Your assigned groups: ${groupsList}`);
    }

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    logger.error('Error in requireGroupAccess middleware:', { error: error.message });
    throw new ApiError(500, 'Error checking group permissions');
  }
};

/**
 * Filter data by staff's group permissions
 * @param {Array} data - Array of records to filter
 * @param {object} req - Express request object
 * @param {string} groupField - Field name containing group ID (default: 'groupID')
 * @returns {Array} Filtered array
 */
const filterByGroupPermissions = (data, req, groupField = 'groupID') => {
  if (!data || data.length === 0) {
    return [];
  }

  // Get staff's permitted groups from token
  const permittedGroups = getStaffGroupPermissions(req);

  // null = full access (admin or no restrictions)
  if (permittedGroups === null) {
    return data;
  }

  // Empty array = has restrictions but no groups assigned (shouldn't happen, but block access)
  if (permittedGroups.length === 0) {
    return [];
  }

  // Filter data by permitted groups
  return data.filter((item) => {
    const itemGroupId = item[groupField] || item.groupId || item.GroupID;
    return permittedGroups.includes(itemGroupId);
  });
};

/**
 * Attach group permissions to request for easy access in controllers
 */
const attachGroupPermissions = async (req, res, next) => {
  try {
    const staffId = req.user?.memberId || req.user?.staffId || req.user?.userId;

    if (!staffId) {
      req.groupPermissions = null; // No staff ID = full access (dev mode)
      return next();
    }

    req.groupPermissions = getStaffGroupPermissions(req);
    next();
  } catch (error) {
    logger.error('Error attaching group permissions:', { error: error.message });
    req.groupPermissions = null; // On error, allow full access to prevent blocking
    next();
  }
};

/**
 * Check if staff has access to a specific group ID
 * @param {object} req - Express request object
 * @param {string} groupID - Group ID to check
 * @returns {boolean} True if staff has access, false otherwise
 */
const hasAccessToGroup = (req, groupID) => {
  const groupPermissions = getStaffGroupPermissions(req);
  
  // null = full access (admin or no restrictions)
  if (groupPermissions === null) {
    return true;
  }
  
  // Check if groupID is in the permitted list
  return groupPermissions.includes(groupID);
};

/**
 * Middleware to validate group access for CRUD operations
 * Throws error if staff tries to modify a group they don't have access to
 */
const validateGroupAccess = (groupIdField = 'groupID') => {
  return async (req, res, next) => {
    const groupID = req.body[groupIdField] || req.params[groupIdField] || req.query[groupIdField];
    
    if (!groupID) {
      return next(); // No group specified, let it pass
    }
    
    if (!hasAccessToGroup(req, groupID)) {
      // Get user's accessible groups for error context
      const userGroups = getStaffGroupPermissions(req);
      let groupsList = 'No groups assigned';
      if (Array.isArray(userGroups) && userGroups.length > 0) {
        try {
          const sheetsService = require('../services/sheetsService');
          const groups = await sheetsService.getSheetObjects(sheetsService.SHEETS.GROUPS);
          const groupNames = groups
            .filter(g => userGroups.includes(g.groupID))
            .map(g => g.groupName)
            .join(', ');
          groupsList = groupNames || userGroups.join(', ');
        } catch (error) {
          groupsList = userGroups.join(', ');
        }
      }
      throw new ApiError(403, `You don't have access to this group. Your assigned groups: ${groupsList}`);
    }
    
    next();
  };
};

module.exports = {
  getStaffGroupPermissions,
  requireGroupAccess,
  filterByGroupPermissions,
  attachGroupPermissions,
  hasAccessToGroup,
  validateGroupAccess,
};
