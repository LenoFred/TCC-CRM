/**
 * Families Routes
 * Defines all family-related endpoints
 */

const express = require('express');
const router = express.Router();
const familiesController = require('../controllers/familiesController');
const { authenticate, requirePermission } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { validate, schemas } = require('../../utils/validation');

/**
 * @route   GET /api/families/stats
 * @desc    Get family statistics
 * @access  Public (Authentication temporarily disabled)
 */
router.get(
  '/stats',
  authenticate,
  requirePermission('can_view_families'),
  asyncHandler(familiesController.getStats.bind(familiesController))
);

/**
 * @route   GET /api/families
 * @desc    Get all families with optional members
 * @access  Public (Authentication temporarily disabled)
 */
router.get(
  '/',
  authenticate,
  requirePermission('can_view_families'),
  asyncHandler(familiesController.getAll.bind(familiesController))
);

/**
 * @route   GET /api/families/:id
 * @desc    Get single family by ID with members
 * @access  Public (Authentication temporarily disabled)
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('can_view_families'),
  asyncHandler(familiesController.getById.bind(familiesController))
);

/**
 * @route   POST /api/families
 * @desc    Create new family
 * @access  Public (Authentication temporarily disabled)
 */
router.post(
  '/',
  authenticate,
  requirePermission('can_add_families'),
  validate(schemas.family.create),
  asyncHandler(familiesController.create.bind(familiesController))
);

/**
 * @route   POST /api/families/:id/members
 * @desc    Add member to family
 * @access  Public (Authentication temporarily disabled)
 */
router.post(
  '/:id/members',
  authenticate,
  requirePermission('can_edit_families'),
  asyncHandler(familiesController.addMember.bind(familiesController))
);

/**
 * @route   PATCH /api/families/:id
 * @desc    Update family
 * @access  Public (Authentication temporarily disabled)
 */
router.patch(
  '/:id',
  authenticate,
  requirePermission('can_edit_families'),
  // validate(schemas.family.update),
  asyncHandler(familiesController.update.bind(familiesController))
);

/**
 * @route   PUT /api/families/:id
 * @desc    Update family (alternative method)
 * @access  Public (Authentication temporarily disabled)
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('can_edit_families'),
  asyncHandler(familiesController.update.bind(familiesController))
);

/**
 * @route   DELETE /api/families/:id/members/:memberId
 * @desc    Remove member from family
 * @access  Public (Authentication temporarily disabled)
 */
router.delete(
  '/:id/members/:memberId',
  authenticate,
  requirePermission('can_edit_families'),
  asyncHandler(familiesController.removeMember.bind(familiesController))
);

/**
 * @route   DELETE /api/families/:id
 * @desc    Delete family
 * @access  Public (Authentication temporarily disabled)
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('can_delete_families'),
  asyncHandler(familiesController.delete.bind(familiesController))
);

module.exports = router;
