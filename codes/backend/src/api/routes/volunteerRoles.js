/**
 * VolunteerRoles Routes
 * Defines all volunteer role endpoints
 */

const express = require('express');
const router = express.Router();
const volunteerRolesController = require('../controllers/volunteerRolesController');
const { authenticate, requirePermission } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');

/**
 * @route   GET /api/volunteer-roles/stats
 * @desc    Get volunteer role statistics
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  requirePermission('can_view_volunteers'),
  asyncHandler(volunteerRolesController.getStats.bind(volunteerRolesController))
);

/**
 * @route   GET /api/volunteer-roles/department/:department
 * @desc    Get roles by department
 * @access  Private
 */
router.get(
  '/department/:department',
  authenticate,
  requirePermission('can_view_volunteers'),
  asyncHandler(volunteerRolesController.getByDepartment.bind(volunteerRolesController))
);

/**
 * @route   GET /api/volunteer-roles
 * @desc    Get all volunteer roles
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  requirePermission('can_view_volunteers'),
  asyncHandler(volunteerRolesController.getAll.bind(volunteerRolesController))
);

/**
 * @route   GET /api/volunteer-roles/:id
 * @desc    Get single volunteer role by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('can_view_volunteers'),
  asyncHandler(volunteerRolesController.getById.bind(volunteerRolesController))
);

/**
 * @route   POST /api/volunteer-roles
 * @desc    Create new volunteer role
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  requirePermission('can_manage_volunteers'),
  asyncHandler(volunteerRolesController.create.bind(volunteerRolesController))
);

/**
 * @route   PATCH /api/volunteer-roles/:id
 * @desc    Update volunteer role
 * @access  Private
 */
router.patch(
  '/:id',
  authenticate,
  requirePermission('can_manage_volunteers'),
  asyncHandler(volunteerRolesController.update.bind(volunteerRolesController))
);

/**
 * @route   DELETE /api/volunteer-roles/:id
 * @desc    Delete volunteer role
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('can_manage_volunteers'),
  asyncHandler(volunteerRolesController.delete.bind(volunteerRolesController))
);

module.exports = router;
