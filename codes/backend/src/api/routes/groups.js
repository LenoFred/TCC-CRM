/**
 * Groups Routes
 * Defines all group-related endpoints
 */

const express = require('express');
const router = express.Router();
const groupsController = require('../controllers/groupsController');
const { authenticate, requirePermission } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { validate, schemas } = require('../../utils/validation');

/**
 * @route   GET /api/groups/stats
 * @desc    Get group statistics
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  requirePermission('can_view_groups'),
  asyncHandler(groupsController.getStats.bind(groupsController))
);

/**
 * @route   GET /api/groups/leader/:leaderID
 * @desc    Get groups by leader
 * @access  Private
 */
router.get(
  '/leader/:leaderID',
  authenticate,
  requirePermission('can_view_groups'),
  asyncHandler(groupsController.getGroupsByLeader.bind(groupsController))
);

/**
 * @route   GET /api/groups
 * @desc    Get all groups
 * @access  Private
 */
router.get(
  '/',
  // authenticate,
  // requirePermission('can_view_groups'),
  asyncHandler(groupsController.getAll.bind(groupsController))
);

/**
 * @route   GET /api/groups/:id
 * @desc    Get single group by ID
 * @access  Private
 */
router.get(
  '/:id',
  // authenticate,
  // requirePermission('can_view_groups'),
  asyncHandler(groupsController.getById.bind(groupsController))
);

/**
 * @route   GET /api/groups/:id/members
 * @desc    Get group with its members
 * @access  Private
 */
router.get(
  '/:id/members',
  authenticate,
  requirePermission('can_view_groups'),
  asyncHandler(groupsController.getGroupWithMembers.bind(groupsController))
);

/**
 * @route   POST /api/groups
 * @desc    Create new group
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  requirePermission('can_add_groups'),
  validate(schemas.group.create),
  asyncHandler(groupsController.create.bind(groupsController))
);

/**
 * @route   PATCH /api/groups/:id
 * @desc    Update group
 * @access  Private
 */
router.patch(
  '/:id',
  authenticate,
  requirePermission('can_edit_groups'),
  validate(schemas.group.update),
  asyncHandler(groupsController.update.bind(groupsController))
);

/**
 * @route   DELETE /api/groups/:id
 * @desc    Delete group
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('can_delete_groups'),
  asyncHandler(groupsController.delete.bind(groupsController))
);

module.exports = router;
