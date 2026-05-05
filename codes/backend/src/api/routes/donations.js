/**
 * Donations Routes
 * Defines all donation-related endpoints
 */

const express = require('express');
const router = express.Router();
const donationsController = require('../controllers/donationsController');
const { authenticate, requirePermission } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { validate, schemas } = require('../../utils/validation');

/**
 * @route   GET /api/donations/stats
 * @desc    Get donation statistics
 * @access  Private (temporarily disabled for testing)
 */
router.get(
  '/stats',
  authenticate,
  requirePermission('can_view_donations'),
  asyncHandler(donationsController.getStats.bind(donationsController))
);

/**
 * @route   GET /api/donations/member/:memberID
 * @desc    Get donations by member
 * @access  Private (temporarily disabled for testing)
 */
router.get(
  '/member/:memberID',
  authenticate,
  requirePermission('can_view_donations'),
  asyncHandler(donationsController.getByMember.bind(donationsController))
);

/**
 * @route   GET /api/donations
 * @desc    Get all donations
 * @access  Private (temporarily disabled for testing)
 */
router.get(
  '/',
  authenticate,
  requirePermission('can_view_donations'),
  asyncHandler(donationsController.getAll.bind(donationsController))
);

/**
 * @route   GET /api/donations/:id
 * @desc    Get single donation by ID
 * @access  Private (temporarily disabled for testing)
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('can_view_donations'),
  asyncHandler(donationsController.getById.bind(donationsController))
);

/**
 * @route   POST /api/donations
 * @desc    Create new donation
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  requirePermission('can_create_donations'),
  // validate(schemas.donation.create),
  asyncHandler(donationsController.create.bind(donationsController))
);

/**
 * @route   PATCH /api/donations/:id/verify
 * @desc    Verify donation
 * @access  Private (temporarily disabled for testing)
 */
router.patch(
  '/:id/verify',
  authenticate,
  requirePermission('can_verify_donations'),
  asyncHandler(donationsController.verify.bind(donationsController))
);

/**
 * @route   PATCH /api/donations/:id
 * @desc    Update donation
 * @access  Private (temporarily disabled for testing)
 */
router.patch(
  '/:id',
  authenticate,
  requirePermission('can_edit_donations'),
  // validate(schemas.donation.update),
  asyncHandler(donationsController.update.bind(donationsController))
);

/**
 * @route   DELETE /api/donations/:id
 * @desc    Delete donation
 * @access  Private (temporarily disabled for testing)
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('can_delete_donations'),
  asyncHandler(donationsController.delete.bind(donationsController))
);

module.exports = router;
