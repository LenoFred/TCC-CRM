/**
 * Communications Routes
 * Defines all communication endpoints (SMS, Email, WhatsApp)
 */

const express = require('express');
const router = express.Router();
const communicationsController = require('../controllers/communicationsController');
const { authenticate, requirePermission } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { validate, schemas } = require('../../utils/validation');

/**
 * @route   GET /api/communications/stats
 * @desc    Get communication statistics
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  requirePermission('can_view_communications'),
  asyncHandler(communicationsController.getStats.bind(communicationsController))
);

/**
 * @route   GET /api/communications/recipient/:recipientID
 * @desc    Get communications by recipient
 * @access  Private
 */
router.get(
  '/recipient/:recipientID',
  authenticate,
  requirePermission('can_view_communications'),
  asyncHandler(communicationsController.getByRecipient.bind(communicationsController))
);

/**
 * @route   GET /api/communications
 * @desc    Get all communications
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  requirePermission('can_view_communications'),
  asyncHandler(communicationsController.getAll.bind(communicationsController))
);

/**
 * @route   GET /api/communications/:id
 * @desc    Get single communication by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('can_view_communications'),
  asyncHandler(communicationsController.getById.bind(communicationsController))
);

/**
 * @route   POST /api/communications/bulk
 * @desc    Send bulk message to multiple recipients
 * @access  Private
 */
router.post(
  '/bulk',
  authenticate,
  requirePermission('can_send_communications'),
  asyncHandler(communicationsController.sendBulk.bind(communicationsController))
);

/**
 * @route   POST /api/communications
 * @desc    Create/send new communication
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  requirePermission('can_send_communications'),
  validate(schemas.communication.create),
  asyncHandler(communicationsController.create.bind(communicationsController))
);

/**
 * @route   PATCH /api/communications/:id/status
 * @desc    Update communication status
 * @access  Private
 */
router.patch(
  '/:id/status',
  authenticate,
  requirePermission('can_manage_communications'),
  asyncHandler(communicationsController.updateStatus.bind(communicationsController))
);

/**
 * @route   PATCH /api/communications/:id
 * @desc    Update communication
 * @access  Private
 */
router.patch(
  '/:id',
  authenticate,
  requirePermission('can_manage_communications'),
  validate(schemas.communication.update),
  asyncHandler(communicationsController.update.bind(communicationsController))
);

/**
 * @route   DELETE /api/communications/:id
 * @desc    Delete communication
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('can_delete_communications'),
  asyncHandler(communicationsController.delete.bind(communicationsController))
);

module.exports = router;
