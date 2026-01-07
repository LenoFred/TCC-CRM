/**
 * Settings Routes
 * Routes for system settings and integration management
 */

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { authenticate } = require('../../middlewares/auth');

/**
 * @route   GET /api/settings/integrations/status
 * @desc    Get status of all integrations
 * @access  Public
 */
router.get(
  '/integrations/status',
  asyncHandler(settingsController.getIntegrationStatus.bind(settingsController))
);

module.exports = router;
