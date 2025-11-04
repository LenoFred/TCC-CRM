/**
 * Members Routes
 * Defines all member-related endpoints
 */

const express = require('express');
const router = express.Router();
const membersController = require('../controllers/membersController');
const { authenticate, requirePermission } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { validate, schemas } = require('../../utils/validation');

/**
 * @route   GET /api/members/stats
 * @desc    Get member statistics
 * @access  Private (temporarily disabled for testing)
 */
router.get(
  '/stats',
  // authenticate,
  // requirePermission('can_view_members'),
  asyncHandler(membersController.getStats.bind(membersController))
);

/**
 * @route   GET /api/members/family/:familyId
 * @desc    Get all members in a family
 * @access  Private (temporarily disabled for testing)
 */
router.get(
  '/family/:familyId',
  // authenticate,
  // requirePermission('can_view_members'),
  asyncHandler(membersController.getMembersByFamily.bind(membersController))
);

/**
 * @route   GET /api/members
 * @desc    Get all members with pagination and search
 * @access  Private (temporarily disabled for testing)
 */
router.get(
  '/',
  // authenticate,
  // requirePermission('can_view_members'),
  asyncHandler(membersController.getAll.bind(membersController))
);

/**
 * @route   GET /api/members/:id
 * @desc    Get single member by ID
 * @access  Private (temporarily disabled for testing)
 */
router.get(
  '/:id',
  // authenticate,
  // requirePermission('can_view_members'),
  asyncHandler(membersController.getById.bind(membersController))
);

/**
 * @route   GET /api/members/:id/family
 * @desc    Get member with family details
 * @access  Private (temporarily disabled for testing)
 */
router.get(
  '/:id/family',
  // authenticate,
  // requirePermission('can_view_members'),
  asyncHandler(membersController.getMemberWithFamily.bind(membersController))
);

/**
 * @route   POST /api/members
 * @desc    Create new member
 * @access  Private (temporarily disabled for testing)
 */
router.post(
  '/',
  // authenticate,
  // requirePermission('can_add_members'),
  // validate(schemas.member.create),
  asyncHandler(membersController.create.bind(membersController))
);

/**
 * @route   PATCH /api/members/:id
 * @desc    Update member
 * @access  Private (temporarily disabled for testing)
 */
router.patch(
  '/:id',
  // authenticate,
  // requirePermission('can_edit_members'),
  // validate(schemas.member.update),
  asyncHandler(membersController.update.bind(membersController))
);

/**
 * @route   DELETE /api/members/:id
 * @desc    Delete member
 * @access  Private (temporarily disabled for testing)
 */
router.delete(
  '/:id',
  // authenticate,
  // requirePermission('can_delete_members'),
  asyncHandler(membersController.delete.bind(membersController))
);

module.exports = router;
