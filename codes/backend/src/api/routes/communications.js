/**
 * Communications Routes
 * Defines all communication endpoints (SMS, Email, WhatsApp)
 */

const express = require('express');
const router = express.Router();
const communicationsController = require('../controllers/communicationsController');
const scheduledMessagesController = require('../controllers/scheduledMessagesController');
const { authenticate, requirePermission } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { validate, schemas } = require('../../utils/validation');

/**
 * @route   GET /api/communications/drafts
 * @desc    Get all drafts (stub for development)
 * @access  Public (Auth disabled for development)
 */
router.get('/drafts', (req, res) => {
  res.json({ success: true, data: [] });
});

/**
 * @route   GET /api/communications/scheduled
 * @desc    Get active scheduled messages (excludes sent unless searching)
 * @access  Public (Auth disabled for development)
 * @query   search, page, limit, scheduleType, recipientType, status
 */
router.get(
  '/scheduled',
  // authenticate,
  // requirePermission('can_view_communications'),
  asyncHandler(scheduledMessagesController.getActiveSchedules.bind(scheduledMessagesController))
);

/**
 * @route   GET /api/communications/scheduled/all
 * @desc    Get all scheduled messages including sent (for search)
 * @access  Public (Auth disabled for development)
 */
router.get(
  '/scheduled/all',
  // authenticate,
  // requirePermission('can_view_communications'),
  asyncHandler(scheduledMessagesController.getAll.bind(scheduledMessagesController))
);

/**
 * @route   GET /api/communications/scheduled/:id
 * @desc    Get single scheduled message by ID
 * @access  Public (Auth disabled for development)
 */
router.get(
  '/scheduled/:id',
  // authenticate,
  // requirePermission('can_view_communications'),
  asyncHandler(scheduledMessagesController.getById.bind(scheduledMessagesController))
);

/**
 * @route   POST /api/communications/scheduled
 * @desc    Create new scheduled message
 * @access  Public (Auth disabled for development)
 */
router.post(
  '/scheduled',
  // authenticate,
  // requirePermission('can_create_communications'),
  // validate(schemas.scheduledMessage.create),
  asyncHandler(scheduledMessagesController.create.bind(scheduledMessagesController))
);

/**
 * @route   PATCH /api/communications/scheduled/:id
 * @desc    Update scheduled message
 * @access  Public (Auth disabled for development)
 */
router.patch(
  '/scheduled/:id',
  // authenticate,
  // requirePermission('can_update_communications'),
  asyncHandler(scheduledMessagesController.update.bind(scheduledMessagesController))
);

/**
 * @route   POST /api/communications/scheduled/:id/cancel
 * @desc    Cancel scheduled message
 * @access  Public (Auth disabled for development)
 */
router.post(
  '/scheduled/:id/cancel',
  // authenticate,
  // requirePermission('can_update_communications'),
  asyncHandler(scheduledMessagesController.cancel.bind(scheduledMessagesController))
);

/**
 * @route   DELETE /api/communications/scheduled/:id
 * @desc    Delete scheduled message
 * @access  Public (Auth disabled for development)
 */
router.delete(
  '/scheduled/:id',
  // authenticate,
  // requirePermission('can_delete_communications'),
  asyncHandler(scheduledMessagesController.delete.bind(scheduledMessagesController))
);

/**
 * @route   GET /api/communications/history
 * @desc    Get communications history with custom date range filtering
 * @access  Public (Auth disabled for development)
 * @query   startDate, endDate, channel, status
 */
router.get(
  '/history',
  // authenticate,
  // requirePermission('can_view_communications'),
  asyncHandler(communicationsController.getHistory.bind(communicationsController))
);

/**
 * @route   GET /api/communications/analytics
 * @desc    Get communications analytics (cost analysis, peak times, delivery rates)
 * @access  Public (Auth disabled for development)
 * @query   startDate, endDate
 */
router.get(
  '/analytics',
  // authenticate,
  // requirePermission('can_view_communications'),
  asyncHandler(communicationsController.getAnalytics.bind(communicationsController))
);

/**
 * @route   GET /api/communications/stats
 * @desc    Get communication statistics
 * @access  Public (Auth disabled for development)
 */
router.get(
  '/stats',
  // authenticate,
  // requirePermission('can_view_communications'),
  asyncHandler(communicationsController.getStats.bind(communicationsController))
);

/**
 * @route   GET /api/communications/recipient/:recipientID
 * @desc    Get communications by recipient
 * @access  Public (Auth disabled for development)
 */
router.get(
  '/recipient/:recipientID',
  // authenticate,
  // requirePermission('can_view_communications'),
  asyncHandler(communicationsController.getByRecipient.bind(communicationsController))
);

/**
 * @route   GET /api/communications
 * @desc    Get all communications
 * @access  Public (Auth disabled for development)
 */
router.get(
  '/',
  // authenticate,
  // requirePermission('can_view_communications'),
  asyncHandler(communicationsController.getAll.bind(communicationsController))
);

/**
 * @route   GET /api/communications/:id
 * @desc    Get single communication by ID
 * @access  Public (Auth disabled for development)
 */
router.get(
  '/:id',
  // authenticate,
  // requirePermission('can_view_communications'),
  asyncHandler(communicationsController.getById.bind(communicationsController))
);

/**
 * @route   POST /api/communications/bulk
 * @desc    Send bulk message to multiple recipients
 * @access  Public (Auth disabled for development)
 */
router.post(
  '/bulk',
  // authenticate,
  // requirePermission('can_send_communications'),
  asyncHandler(communicationsController.sendBulk.bind(communicationsController))
);

/**
 * @route   POST /api/communications
 * @desc    Create/send new communication
 * @access  Public (Auth disabled for development)
 */
router.post(
  '/',
  // authenticate,
  // requirePermission('can_send_communications'),
  validate(schemas.communication.create),
  asyncHandler(communicationsController.create.bind(communicationsController))
);

/**
 * @route   PATCH /api/communications/:id/status
 * @desc    Update communication status
 * @access  Public (Auth disabled for development)
 */
router.patch(
  '/:id/status',
  // authenticate,
  // requirePermission('can_manage_communications'),
  asyncHandler(communicationsController.updateStatus.bind(communicationsController))
);

/**
 * @route   PATCH /api/communications/:id
 * @desc    Update communication
 * @access  Public (Auth disabled for development)
 */
router.patch(
  '/:id',
  // authenticate,
  // requirePermission('can_manage_communications'),
  validate(schemas.communication.update),
  asyncHandler(communicationsController.update.bind(communicationsController))
);

/**
 * @route   DELETE /api/communications/:id
 * @desc    Delete communication
 * @access  Public (Auth disabled for development)
 */
router.delete(
  '/:id',
  // authenticate,
  // requirePermission('can_delete_communications'),
  asyncHandler(communicationsController.delete.bind(communicationsController))
);

module.exports = router;
