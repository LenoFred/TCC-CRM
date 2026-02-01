/**
 * Templates Routes
 * API endpoints for Communication_Templates management
 */

const express = require('express');
const router = express.Router();
const templatesController = require('../controllers/templatesController');
const { authenticate, requirePermission } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');

/**
 * @route   GET /api/templates
 * @desc    Get all active templates
 * @access  Public (Auth disabled for development)
 */
router.get(
  '/',
  authenticate,
  requirePermission('can_view_communications'),
  asyncHandler(templatesController.getAll.bind(templatesController))
);

/**
 * @route   GET /api/templates/stats
 * @desc    Get template statistics
 * @access  Public (Auth disabled for development)
 */
router.get(
  '/stats',
  authenticate,
  requirePermission('can_view_communications'),
  asyncHandler(templatesController.getStats.bind(templatesController))
);

/**
 * @route   GET /api/templates/channel/:channel
 * @desc    Get templates by channel (sms, whatsapp, email)
 * @access  Public (Auth disabled for development)
 */
router.get(
  '/channel/:channel',
  authenticate,
  requirePermission('can_view_communications'),
  asyncHandler(templatesController.getByChannel.bind(templatesController))
);

/**
 * @route   GET /api/templates/audience/:audience
 * @desc    Get templates by audience (members, guests, volunteers, all)
 * @access  Public (Auth disabled for development)
 */
router.get(
  '/audience/:audience',
  authenticate,
  requirePermission('can_view_communications'),
  asyncHandler(templatesController.getByAudience.bind(templatesController))
);

/**
 * @route   GET /api/templates/:id
 * @desc    Get single template by ID
 * @access  Public (Auth disabled for development)
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('can_view_communications'),
  asyncHandler(templatesController.getById.bind(templatesController))
);

/**
 * @route   POST /api/templates
 * @desc    Create new template
 * @access  Public (Auth disabled for development)
 */
router.post(
  '/',
  authenticate,
  requirePermission('can_create_communications'),
  asyncHandler(templatesController.create.bind(templatesController))
);

/**
 * @route   PATCH /api/templates/:id
 * @desc    Update template
 * @access  Public (Auth disabled for development)
 */
router.patch(
  '/:id',
  authenticate,
  requirePermission('can_update_communications'),
  asyncHandler(templatesController.update.bind(templatesController))
);

/**
 * @route   POST /api/templates/:id/deactivate
 * @desc    Deactivate template (soft delete)
 * @access  Public (Auth disabled for development)
 */
router.post(
  '/:id/deactivate',
  authenticate,
  requirePermission('can_delete_communications'),
  asyncHandler(templatesController.deactivate.bind(templatesController))
);

/**
 * @route   POST /api/templates/:id/preview
 * @desc    Render template with variables (preview before sending)
 * @access  Public (Auth disabled for development)
 */
router.post(
  '/:id/preview',
  authenticate,
  requirePermission('can_view_communications'),
  asyncHandler(templatesController.renderPreview.bind(templatesController))
);

module.exports = router;
