/**
 * Authentication Routes
 * Defines all authentication-related endpoints
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, requirePermission } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { validate, schemas } = require('../../utils/validation');

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post(
  '/login',
  validate(schemas.auth.login),
  asyncHandler(authController.login)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout current user
 * @access  Public (but clears cookies if authenticated)
 */
router.post(
  '/logout',
  asyncHandler(authController.logout)
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (requires valid refresh token)
 */
router.post(
  '/refresh',
  asyncHandler(authController.refresh)
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(authController.getCurrentUser)
);

/**
 * @route   GET /api/auth/validate
 * @desc    Validate current token
 * @access  Private
 */
router.get(
  '/validate',
  authenticate,
  asyncHandler(authController.validateToken)
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change current user's password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  validate(schemas.auth.changePassword),
  asyncHandler(authController.changePassword)
);

/**
 * @route   POST /api/auth/register
 * @desc    Register new staff member (Admin only)
 * @access  Private (requires admin permission)
 */
router.post(
  '/register',
  authenticate,
  requirePermission('can_manage_staff'),
  validate(schemas.auth.register),
  asyncHandler(authController.registerStaff)
);

module.exports = router;
