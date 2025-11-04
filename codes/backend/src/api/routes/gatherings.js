/**
 * Gatherings Routes
 * Defines all gathering-related endpoints
 */

const express = require('express');
const router = express.Router();
const gatheringsController = require('../controllers/gatheringsController');
const { authenticate, requirePermission } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { validate, schemas } = require('../../utils/validation');

/**
 * @route   GET /api/gatherings/stats
 * @desc    Get gathering statistics
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  requirePermission('can_view_attendance'),
  asyncHandler(gatheringsController.getStats.bind(gatheringsController))
);

/**
 * @route   GET /api/gatherings/event/:eventID
 * @desc    Get gatherings by event
 * @access  Private
 */
router.get(
  '/event/:eventID',
  authenticate,
  requirePermission('can_view_attendance'),
  asyncHandler(gatheringsController.getByEvent.bind(gatheringsController))
);

/**
 * @route   GET /api/gatherings
 * @desc    Get all gatherings
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  requirePermission('can_view_attendance'),
  asyncHandler(gatheringsController.getAll.bind(gatheringsController))
);

/**
 * @route   GET /api/gatherings/:id
 * @desc    Get single gathering by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('can_view_attendance'),
  asyncHandler(gatheringsController.getById.bind(gatheringsController))
);

/**
 * @route   POST /api/gatherings
 * @desc    Create new gathering
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  requirePermission('can_add_attendance'),
  validate(schemas.gathering.create),
  asyncHandler(gatheringsController.create.bind(gatheringsController))
);

/**
 * @route   PATCH /api/gatherings/:id/attendance
 * @desc    Update gathering attendance count
 * @access  Private
 */
router.patch(
  '/:id/attendance',
  authenticate,
  requirePermission('can_edit_attendance'),
  asyncHandler(gatheringsController.updateAttendance.bind(gatheringsController))
);

/**
 * @route   PATCH /api/gatherings/:id
 * @desc    Update gathering
 * @access  Private
 */
router.patch(
  '/:id',
  authenticate,
  requirePermission('can_edit_attendance'),
  validate(schemas.gathering.update),
  asyncHandler(gatheringsController.update.bind(gatheringsController))
);

/**
 * @route   DELETE /api/gatherings/:id
 * @desc    Delete gathering
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('can_delete_attendance'),
  asyncHandler(gatheringsController.delete.bind(gatheringsController))
);

module.exports = router;
