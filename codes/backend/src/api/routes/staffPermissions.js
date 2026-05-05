/**
 * Staff Permissions Routes
 * Handles staff permission management endpoints
 */

const express = require('express');
const router = express.Router();
const staffPermissionsController = require('../controllers/staffPermissionsController');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { authenticate, requirePermission } = require('../../middlewares/auth');

/**
 * @route   GET /api/staff-permissions/available
 * @desc    Get all available system permissions
 * @access  Private - Authenticated users
 */
router.get('/available',
  authenticate,
  asyncHandler(staffPermissionsController.getAllAvailable.bind(staffPermissionsController))
);

/**
 * @route   GET /api/staff-permissions/:staffId
 * @desc    Get permissions for a specific staff member
 * @access  Private - Requires can_manage_staff or is viewing own permissions
 */
router.get('/:staffId',
  authenticate,
  asyncHandler(staffPermissionsController.getByStaffId.bind(staffPermissionsController))
);

/**
 * @route   POST /api/staff-permissions/:staffId
 * @desc    Update permissions for a staff member
 * @access  Private - Requires can_manage_staff permission
 */
router.post('/:staffId',
  authenticate,
  requirePermission('can_manage_staff'),
  asyncHandler(staffPermissionsController.updateStaffPermissions.bind(staffPermissionsController))
);

/**
 * @route   GET /api/staff-permissions
 * @desc    Get all staff permissions (for admin overview)
 * @access  Private - Requires can_manage_staff permission
 */
router.get('/',
  authenticate,
  requirePermission('can_manage_staff'),
  asyncHandler(staffPermissionsController.getAll.bind(staffPermissionsController))
);

module.exports = router;
