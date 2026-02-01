/**
 * Authentication Middleware
 * Validates JWT tokens and checks user permissions
 */

const authService = require('../services/authService');
const { logger } = require('../utils/logger');

/**
 * Extract token from request headers
 * @param {object} req - Express request object
 * @returns {string|null} JWT token or null
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Support both "Bearer TOKEN" and "TOKEN" formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return authHeader;
};

/**
 * Middleware to verify JWT token and attach user to request
 * Usage: router.get('/protected', authenticate, (req, res) => { ... })
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided',
      });
    }

    // Verify token
    const decoded = authService.verifyToken(token);

    // Attach user data to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      memberId: decoded.memberId,
      role: decoded.role,
      groupPermissions: decoded.groupPermissions !== undefined ? decoded.groupPermissions : null, // Preserve null for admin
    };
    
    // Check if user is admin first - admins get all permissions automatically
    if (req.user.role?.toLowerCase() === 'admin') {
      // Admin gets ALL permissions automatically as flat string array
      req.user.permissions = [
        'can_view_members', 'can_add_members', 'can_edit_members', 'can_delete_members',
        'can_view_families', 'can_add_families', 'can_edit_families', 'can_delete_families',
        'can_view_groups', 'can_add_groups', 'can_edit_groups', 'can_delete_groups',
        'can_view_attendance', 'can_add_attendance', 'can_edit_attendance', 'can_delete_attendance', 'can_mark_attendance',
        'can_view_volunteers', 'can_manage_volunteers',
        'can_view_communications', 'can_create_communications', 'can_update_communications', 'can_delete_communications',
        'can_send_sms', 'can_send_email',
        'can_view_analytics', 'can_generate_reports', 'can_view_reports', 'can_export_data',
        'can_view_donations', 'can_manage_donations',
        'can_view_events', 'can_add_events', 'can_edit_events', 'can_delete_events', 'can_manage_events',
        'can_view_staff', 'can_manage_staff',
        'can_view_support_requests', 'can_create_support_requests', 'can_manage_support_requests', 'can_delete_support_requests',
        'can_manage_settings', 'can_view_settings'
      ];
      req.user.groupPermissions = null; // Admin has access to all groups (null = no restrictions)
      logger.info('Admin user authenticated - full permissions and group access granted', { 
        userId: req.user.userId, 
        role: req.user.role,
        permissionsCount: req.user.permissions.length
      });
    } else if (decoded.userId) {
      // Staff: Get permissions from StaffPermissions sheet using userId (which is staffID)
      const permissionsData = await authService.getStaffPermissions(decoded.userId);
      req.user.permissions = permissionsData.permissions || [];
      req.user.groupPermissions = permissionsData.groupPermissions || [];
      
      // Handle group permissions for non-admin
      if (!req.user.groupPermissions || req.user.groupPermissions.length === 0) {
        // Non-admin with no group restrictions = full access to groups
        req.user.groupPermissions = null;
        logger.info('Staff user with no group restrictions - full group access granted', { 
          userId: req.user.userId 
        });
      } else {
        logger.info('Staff user with group restrictions', { 
          userId: req.user.userId, 
          groupPermissions: req.user.groupPermissions 
        });
      }
    } else {
      req.user.permissions = [];
      req.user.groupPermissions = null; // No memberId = full access (dev mode)
    }

    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error.message,
      ip: req.ip,
      path: req.path,
    });

    if (error.message === 'Token has expired') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or malformed token',
    });
  }
};

/**
 * Middleware to check if user has required permission
 * Usage: router.post('/members', authenticate, requirePermission('can_add_members'), (req, res) => { ... })
 * @param {string} permission - Required permission key
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to perform this action',
      });
    }

    const userPermissions = req.user.permissions || [];

    // Admin safety: grant all permissions implicitly
    if (req.user.role?.toLowerCase() === 'admin') {
      return next();
    }

    // Check if user has the required permission
    if (!userPermissions.includes(permission)) {
      logger.warn('Permission denied', {
        userId: req.user.userId,
        requiredPermission: permission,
        userPermissions,
        path: req.path,
      });

      return res.status(403).json({
        error: 'Permission denied',
        message: `You do not have permission to perform this action. Required: ${permission}`,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has ANY of the specified permissions
 * Usage: router.get('/analytics', authenticate, requireAnyPermission(['can_view_analytics', 'admin']), ...)
 * @param {Array<string>} permissions - Array of permission keys
 */
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    const userPermissions = req.user.permissions || [];

    // Check if user has any of the required permissions
    const hasPermission = permissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      logger.warn('Permission denied (any)', {
        userId: req.user.userId,
        requiredPermissions: permissions,
        userPermissions,
        path: req.path,
      });

      return res.status(403).json({
        error: 'Permission denied',
        message: `You do not have sufficient permissions. Required: ${permissions.join(' or ')}`,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has ALL of the specified permissions
 * Usage: router.delete('/members/:id', authenticate, requireAllPermissions(['can_delete_members', 'admin']), ...)
 * @param {Array<string>} permissions - Array of permission keys
 */
const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    const userPermissions = req.user.permissions || [];

    // Check if user has all required permissions
    const hasAllPermissions = permissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      logger.warn('Permission denied (all)', {
        userId: req.user.userId,
        requiredPermissions: permissions,
        userPermissions,
        path: req.path,
      });

      return res.status(403).json({
        error: 'Permission denied',
        message: `You do not have all required permissions: ${permissions.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has a specific role
 * Usage: router.post('/staff', authenticate, requireRole('Admin'), ...)
 * @param {string} role - Required role
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    if (req.user.role !== role) {
      logger.warn('Role check failed', {
        userId: req.user.userId,
        requiredRole: role,
        userRole: req.user.role,
        path: req.path,
      });

      return res.status(403).json({
        error: 'Permission denied',
        message: `This action requires ${role} role`,
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't reject if token is missing
 * Usage: router.get('/public-with-user-info', optionalAuth, (req, res) => { ... })
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      // No token provided, continue without user
      return next();
    }

    // Try to verify token
    const decoded = authService.verifyToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      memberId: decoded.memberId,
      role: decoded.role,
    };

    if (decoded.memberId) {
      const permissions = await authService.getStaffPermissions(decoded.memberId);
      req.user.permissions = permissions;
    }

    next();
  } catch (error) {
    // Token is invalid, but we don't reject the request
    logger.debug('Optional auth failed, continuing without user', {
      error: error.message,
    });
    next();
  }
};

module.exports = {
  authenticate,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  optionalAuth,
  extractToken,
};
