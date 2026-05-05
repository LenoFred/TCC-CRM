/**
 * Volunteers Routes
 * Defines volunteer endpoints (for form submissions)
 */

const express = require('express');
const router = express.Router();
const volunteersController = require('../controllers/volunteersController');
const { authenticate } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');

/**
 * @route   GET /api/volunteers
 * @desc    Get all volunteers from Volunteer sheet (form submissions)
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  asyncHandler(volunteersController.getAll.bind(volunteersController))
);

module.exports = router;
