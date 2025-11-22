/**
 * VolunteerAssignments Routes
 * Defines all volunteer assignment endpoints
 */

const express = require('express');
const router = express.Router();
const volunteerAssignmentsController = require('../controllers/volunteerAssignmentsController');
const { authenticate, requirePermission } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');

/**
 * @route   GET /api/volunteer-assignments/stats
 * @desc    Get volunteer assignment statistics
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  requirePermission('can_view_volunteers'),
  asyncHandler(volunteerAssignmentsController.getStats.bind(volunteerAssignmentsController))
);

/**
 * @route   GET /api/volunteer-assignments/member/:memberID
 * @desc    Get assignments by member
 * @access  Private
 */
router.get(
  '/member/:memberID',
  authenticate,
  requirePermission('can_view_volunteers'),
  asyncHandler(volunteerAssignmentsController.getByMember.bind(volunteerAssignmentsController))
);

/**
 * @route   GET /api/volunteer-assignments/role/:roleID
 * @desc    Get assignments by role
 * @access  Private (temporarily disabled for testing)
 */
router.get(
  '/role/:roleID',
  // authenticate,
  // requirePermission('can_view_volunteers'),
  asyncHandler(volunteerAssignmentsController.getByRole.bind(volunteerAssignmentsController))
);

/**
 * @route   GET /api/volunteer-assignments
 * @desc    Get all volunteer assignments
 * @access  Private (temporarily disabled for testing)
 */
router.get(
  '/',
  // authenticate,
  // requirePermission('can_view_volunteers'),
  asyncHandler(volunteerAssignmentsController.getAll.bind(volunteerAssignmentsController))
);

/**
 * @route   GET /api/volunteer-assignments/:id
 * @desc    Get single volunteer assignment by ID
 * @access  Private (temporarily disabled for testing)
 */
router.get(
  '/:id',
  // authenticate,
  // requirePermission('can_view_volunteers'),
  asyncHandler(volunteerAssignmentsController.getById.bind(volunteerAssignmentsController))
);

/**
 * @route   POST /api/volunteer-assignments
 * @desc    Create new volunteer assignment
 * @access  Private (temporarily disabled for testing)
 */
router.post(
  '/',
  // authenticate,
  // requirePermission('can_manage_volunteers'),
  asyncHandler(volunteerAssignmentsController.create.bind(volunteerAssignmentsController))
);

/**
 * @route   PATCH /api/volunteer-assignments/:id/complete
 * @desc    Complete/end an assignment
 * @access  Private
 */
router.patch(
  '/:id/complete',
  authenticate,
  requirePermission('can_manage_volunteers'),
  asyncHandler(volunteerAssignmentsController.complete.bind(volunteerAssignmentsController))
);

/**
 * @route   PUT /api/volunteer-assignments/:id
 * @desc    Update volunteer assignment (full update)
 * @access  Private (temporarily disabled for testing)
 */
router.put(
  '/:id',
  // authenticate,
  // requirePermission('can_manage_volunteers'),
  asyncHandler(volunteerAssignmentsController.update.bind(volunteerAssignmentsController))
);

/**
 * @route   PATCH /api/volunteer-assignments/:id
 * @desc    Update volunteer assignment (partial update)
 * @access  Private (temporarily disabled for testing)
 */
router.patch(
  '/:id',
  // authenticate,
  // requirePermission('can_manage_volunteers'),
  asyncHandler(volunteerAssignmentsController.update.bind(volunteerAssignmentsController))
);

/**
 * @route   DELETE /api/volunteer-assignments/:id
 * @desc    Delete volunteer assignment
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('can_manage_volunteers'),
  asyncHandler(volunteerAssignmentsController.delete.bind(volunteerAssignmentsController))
);

module.exports = router;
