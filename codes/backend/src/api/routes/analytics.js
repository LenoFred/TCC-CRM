/**
 * Analytics Routes
 * Handles custom report generation and data analytics
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { asyncHandler } = require('../../middlewares/errorHandler');
// const { authenticate, requirePermission } = require('../../middlewares/auth');

/**
 * @route   POST /api/analytics/generate-report
 * @desc    Generate custom report with filters
 * @access  Public (should be Private in production)
 */
router.post(
  '/generate-report',
  // authenticate,
  // requirePermission('can_view_reports'),
  asyncHandler(analyticsController.generateReport.bind(analyticsController))
);

/**
 * @route   GET /api/analytics/sheet-columns/:sheetName
 * @desc    Get available columns for a sheet
 * @access  Public (should be Private in production)
 */
router.get(
  '/sheet-columns/:sheetName',
  // authenticate,
  // requirePermission('can_view_reports'),
  asyncHandler(analyticsController.getSheetColumns.bind(analyticsController))
);

/**
 * @route   GET /api/analytics/summary-stats
 * @desc    Get summary statistics across all sheets
 * @access  Public (should be Private in production)
 */
router.get(
  '/summary-stats',
  // authenticate,
  // requirePermission('can_view_reports'),
  asyncHandler(analyticsController.getSummaryStats.bind(analyticsController))
);

/**
 * @route   POST /api/analytics/export
 * @desc    Export report data to CSV
 * @access  Public (should be Private in production)
 */
router.post(
  '/export',
  // authenticate,
  // requirePermission('can_view_reports'),
  asyncHandler(analyticsController.exportReport.bind(analyticsController))
);

module.exports = router;
