/**
 * Events Routes
 * Defines all event-related endpoints
 */

const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const { authenticate, requirePermission } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { validate, schemas } = require('../../utils/validation');

/**
 * @route   GET /api/events/stats
 * @desc    Get event statistics
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  requirePermission('can_view_events'),
  asyncHandler(eventsController.getStats.bind(eventsController))
);

/**
 * @route   GET /api/events/upcoming
 * @desc    Get upcoming events
 * @access  Private
 */
router.get(
  '/upcoming',
  authenticate,
  requirePermission('can_view_events'),
  asyncHandler(eventsController.getUpcoming.bind(eventsController))
);

/**
 * @route   GET /api/events/past
 * @desc    Get past events
 * @access  Private
 */
router.get(
  '/past',
  authenticate,
  requirePermission('can_view_events'),
  asyncHandler(eventsController.getPast.bind(eventsController))
);

/**
 * @route   GET /api/events/date-range
 * @desc    Get events by date range
 * @access  Private
 */
router.get(
  '/date-range',
  authenticate,
  requirePermission('can_view_events'),
  asyncHandler(eventsController.getByDateRange.bind(eventsController))
);

/**
 * @route   GET /api/events
 * @desc    Get all events
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  requirePermission('can_view_events'),
  asyncHandler(eventsController.getAll.bind(eventsController))
);

/**
 * @route   GET /api/events/:id
 * @desc    Get single event by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('can_view_events'),
  asyncHandler(eventsController.getById.bind(eventsController))
);

/**
 * @route   POST /api/events
 * @desc    Create new event
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  requirePermission('can_add_events'),
  validate(schemas.event.create),
  asyncHandler(eventsController.create.bind(eventsController))
);

/**
 * @route   PATCH /api/events/:id
 * @desc    Update event
 * @access  Private
 */
router.patch(
  '/:id',
  authenticate,
  requirePermission('can_edit_events'),
  validate(schemas.event.update),
  asyncHandler(eventsController.update.bind(eventsController))
);

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete event
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('can_delete_events'),
  asyncHandler(eventsController.delete.bind(eventsController))
);

module.exports = router;
