/**
 * Staff Routes
 * Defines all staff management endpoints
 */

const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticate, requirePermission, requireRole } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');

/**
 * @route   GET /api/staff/stats
 * @desc    Get staff statistics
 * @access  Private (Admin only)
 */
router.get(
  '/stats',
  authenticate,
  requireRole('Admin'),
  asyncHandler(staffController.getStats.bind(staffController))
);

/**
 * @route   GET /api/staff/role/:role
 * @desc    Get staff by role
 * @access  Private (Admin only)
 */
router.get(
  '/role/:role',
  authenticate,
  requireRole('Admin'),
  asyncHandler(staffController.getByRole.bind(staffController))
);

/**
 * @route   GET /api/staff/department/:department
 * @desc    Get staff by department
 * @access  Private (Admin only)
 */
router.get(
  '/department/:department',
  authenticate,
  requireRole('Admin'),
  asyncHandler(staffController.getByDepartment.bind(staffController))
);

/**
 * @route   GET /api/staff
 * @desc    Get all staff
 * @access  Public (Auth disabled for development)
 */
router.get(
  '/',
  // authenticate,
  // requireRole('Admin'),
  asyncHandler(staffController.getAll.bind(staffController))
);

/**
 * @route   GET /api/staff/:id
 * @desc    Get single staff by ID
 * @access  Private (Admin only)
 */
router.get(
  '/:id',
  authenticate,
  requireRole('Admin'),
  asyncHandler(staffController.getById.bind(staffController))
);

/**
 * @route   POST /api/staff
 * @desc    Create new staff (use /api/auth/register instead)
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  requireRole('Admin'),
  asyncHandler(staffController.create.bind(staffController))
);

/**
 * @route   PATCH /api/staff/:id/status
 * @desc    Update staff status
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/status',
  authenticate,
  requireRole('Admin'),
  asyncHandler(staffController.updateStatus.bind(staffController))
);

/**
 * @route   PATCH /api/staff/:id
 * @desc    Update staff
 * @access  Private (Admin only)
 */
router.patch(
  '/:id',
  authenticate,
  requireRole('Admin'),
  asyncHandler(staffController.update.bind(staffController))
);

/**
 * @route   DELETE /api/staff/:id
 * @desc    Delete staff
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('Admin'),
  asyncHandler(staffController.delete.bind(staffController))
);

module.exports = router;
