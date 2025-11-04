/**
 * Authentication Controller
 * Handles authentication-related requests
 */

const authService = require('../../services/authService');
const { logger, logAuthEvent } = require('../../utils/logger');
const { ApiError } = require('../../middlewares/errorHandler');

/**
 * Login handler
 * POST /api/auth/login
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  // Set refresh token as httpOnly cookie for security
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    success: true,
    accessToken: result.accessToken,
    user: result.user,
  });
};

/**
 * Logout handler
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  if (req.user) {
    logAuthEvent('LOGOUT', req.user.userId);
  }

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * Refresh token handler
 * POST /api/auth/refresh
 */
const refresh = async (req, res) => {
  // Get refresh token from cookie or body
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new ApiError('Refresh token required', 401);
  }

  const result = await authService.refreshAccessToken(refreshToken);

  res.json({
    success: true,
    accessToken: result.accessToken,
    user: result.user,
  });
};

/**
 * Get current user handler
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  if (!req.user) {
    throw new ApiError('Not authenticated', 401);
  }

  // Fetch full user data
  const staff = await authService.getStaffWithMember(req.user.userId);

  if (!staff) {
    throw new ApiError('User not found', 404);
  }

  // Get permissions
  const permissions = await authService.getStaffPermissions(
    req.user.memberId
  );

  // Remove sensitive data
  const { password, passwordHash, ...userWithoutPassword } = staff;

  res.json({
    success: true,
    user: {
      ...userWithoutPassword,
      permissions,
    },
  });
};

/**
 * Change password handler
 * POST /api/auth/change-password
 */
const changePassword = async (req, res) => {
  if (!req.user) {
    throw new ApiError('Not authenticated', 401);
  }

  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(
    req.user.userId,
    currentPassword,
    newPassword
  );

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
};

/**
 * Register staff handler (Admin only)
 * POST /api/auth/register
 */
const registerStaff = async (req, res) => {
  const staffData = req.body;

  const newStaff = await authService.registerStaff(staffData);

  res.status(201).json({
    success: true,
    message: 'Staff registered successfully',
    staff: newStaff,
  });
};

/**
 * Validate token handler (for frontend checks)
 * GET /api/auth/validate
 */
const validateToken = async (req, res) => {
  // If we reach here, token is valid (authenticate middleware passed)
  res.json({
    success: true,
    valid: true,
    user: req.user,
  });
};

module.exports = {
  login,
  logout,
  refresh,
  getCurrentUser,
  changePassword,
  registerStaff,
  validateToken,
};
