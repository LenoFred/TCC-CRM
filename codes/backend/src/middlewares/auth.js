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
    };

    // Fetch full permissions (optional, can be cached)
    if (decoded.memberId) {
      const permissions = await authService.getStaffPermissions(decoded.memberId);
      req.user.permissions = permissions;
    } else {
      req.user.permissions = [];
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
