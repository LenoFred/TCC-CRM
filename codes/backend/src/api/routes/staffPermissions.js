/**
 * Staff Permissions Routes
 * Handles staff permission management endpoints
 */

const express = require('express');
const router = express.Router();
const staffPermissionsController = require('../controllers/staffPermissionsController');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { authenticate } = require('../../middlewares/auth');

/**
 * @route   GET /api/staff-permissions/available
 * @desc    Get all available system permissions
 * @access  Public (TODO: Protect when auth is ready)
 */
router.get('/available', asyncHandler(staffPermissionsController.getAllAvailable.bind(staffPermissionsController)));

/**
 * @route   GET /api/staff-permissions/:staffId
 * @desc    Get permissions for a specific staff member
 * @access  Public (TODO: Protect when auth is ready)
 */
router.get('/:staffId', asyncHandler(staffPermissionsController.getByStaffId.bind(staffPermissionsController)));

/**
 * @route   POST /api/staff-permissions/:staffId
 * @desc    Update permissions for a staff member
 * @access  Public (TODO: Protect when auth is ready, require can_manage_staff_permissions)
 */
router.post('/:staffId', asyncHandler(staffPermissionsController.updateStaffPermissions.bind(staffPermissionsController)));

/**
 * @route   GET /api/staff-permissions
 * @desc    Get all staff permissions (for admin overview)
 * @access  Public (TODO: Protect when auth is ready)
 */
router.get('/', asyncHandler(staffPermissionsController.getAll.bind(staffPermissionsController)));

module.exports = router;
