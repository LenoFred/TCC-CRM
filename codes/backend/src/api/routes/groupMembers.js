/**
 * GroupMembers Routes
 * Defines all group membership endpoints
 */

const express = require('express');
const router = express.Router();
const groupMembersController = require('../controllers/groupMembersController');
const { authenticate, requirePermission } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');

/**
 * @route   GET /api/group-members/group/:groupID
 * @desc    Get all members of a specific group
 * @access  Private
 */
router.get(
  '/group/:groupID',
  authenticate,
  requirePermission('can_view_groups'),
  asyncHandler(groupMembersController.getMembersByGroup.bind(groupMembersController))
);

/**
 * @route   GET /api/group-members/member/:memberID
 * @desc    Get all groups of a specific member
 * @access  Private
 */
router.get(
  '/member/:memberID',
  authenticate,
  requirePermission('can_view_groups'),
  asyncHandler(groupMembersController.getGroupsByMember.bind(groupMembersController))
);

/**
 * @route   GET /api/group-members
 * @desc    Get all group memberships
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  requirePermission('can_view_groups'),
  asyncHandler(groupMembersController.getAll.bind(groupMembersController))
);

/**
 * @route   GET /api/group-members/:id
 * @desc    Get single group membership by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('can_view_groups'),
  asyncHandler(groupMembersController.getById.bind(groupMembersController))
);

/**
 * @route   POST /api/group-members
 * @desc    Add member to group
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  requirePermission('can_edit_groups'),
  asyncHandler(groupMembersController.create.bind(groupMembersController))
);

/**
 * @route   POST /api/group-members/batch-create
 * @desc    Add multiple members to groups (batch operation)
 * @access  Private
 */
router.post(
  '/batch-create',
  authenticate,
  requirePermission('can_edit_groups'),
  asyncHandler(groupMembersController.createMembers.bind(groupMembersController))
);

/**
 * @route   POST /api/group-members/batch-delete
 * @desc    Remove multiple members from groups (batch operation)
 * @access  Private
 */
router.post(
  '/batch-delete',
  authenticate,
  requirePermission('can_edit_groups'),
  asyncHandler(groupMembersController.removeMembers.bind(groupMembersController))
);

/**
 * @route   PATCH /api/group-members/:id
 * @desc    Update group membership
 * @access  Private
 */
router.patch(
  '/:id',
  authenticate,
  requirePermission('can_edit_groups'),
  asyncHandler(groupMembersController.update.bind(groupMembersController))
);

/**
 * @route   DELETE /api/group-members/:id
 * @desc    Remove member from group
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('can_edit_groups'),
  asyncHandler(groupMembersController.removeMember.bind(groupMembersController))
);

module.exports = router;
