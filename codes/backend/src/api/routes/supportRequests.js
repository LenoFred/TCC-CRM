/**
 * SupportRequests Routes
 * Defines all support request endpoints
 */

const express = require('express');
const router = express.Router();
const supportRequestsController = require('../controllers/supportRequestsController');
const { authenticate, requirePermission } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');

/**
 * @route   GET /api/support-requests/stats
 * @desc    Get support request statistics
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  requirePermission('can_view_support_requests'),
  asyncHandler(supportRequestsController.getStats.bind(supportRequestsController))
);

/**
 * @route   GET /api/support-requests/member/:memberID
 * @desc    Get requests by member
 * @access  Private
 */
router.get(
  '/member/:memberID',
  authenticate,
  requirePermission('can_view_support_requests'),
  asyncHandler(supportRequestsController.getByMember.bind(supportRequestsController))
);

/**
 * @route   GET /api/support-requests/assigned/:staffID
 * @desc    Get requests assigned to staff
 * @access  Private
 */
router.get(
  '/assigned/:staffID',
  authenticate,
  requirePermission('can_view_support_requests'),
  asyncHandler(supportRequestsController.getAssignedTo.bind(supportRequestsController))
);

/**
 * @route   GET /api/support-requests
 * @desc    Get all support requests
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  requirePermission('can_view_support_requests'),
  asyncHandler(supportRequestsController.getAll.bind(supportRequestsController))
);

/**
 * @route   GET /api/support-requests/:id
 * @desc    Get single support request by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('can_view_support_requests'),
  asyncHandler(supportRequestsController.getById.bind(supportRequestsController))
);

/**
 * @route   POST /api/support-requests
 * @desc    Create new support request
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  requirePermission('can_create_support_requests'),
  asyncHandler(supportRequestsController.create.bind(supportRequestsController))
);

/**
 * @route   PATCH /api/support-requests/:id/assign
 * @desc    Assign request to staff
 * @access  Private
 */
router.patch(
  '/:id/assign',
  authenticate,
  requirePermission('can_manage_support_requests'),
  asyncHandler(supportRequestsController.assign.bind(supportRequestsController))
);

/**
 * @route   PATCH /api/support-requests/:id/resolve
 * @desc    Resolve support request
 * @access  Private
 */
router.patch(
  '/:id/resolve',
  authenticate,
  requirePermission('can_manage_support_requests'),
  asyncHandler(supportRequestsController.resolve.bind(supportRequestsController))
);

/**
 * @route   PATCH /api/support-requests/:id
 * @desc    Update support request
 * @access  Private
 */
router.patch(
  '/:id',
  authenticate,
  requirePermission('can_manage_support_requests'),
  asyncHandler(supportRequestsController.update.bind(supportRequestsController))
);

/**
 * @route   DELETE /api/support-requests/:id
 * @desc    Delete support request
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('can_delete_support_requests'),
  asyncHandler(supportRequestsController.delete.bind(supportRequestsController))
);

module.exports = router;
