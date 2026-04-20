/**
 * Forms Ingestion Routes
 * Routes for manual triggering of form ingestion
 */

const express = require('express');
const router = express.Router();
const formsController = require('../controllers/formsController');
const { authenticate, requirePermission } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');

// Manual ingestion triggers - REQUIRES authentication and admin permission
router.post('/ingest/all',
  authenticate,
  requirePermission('can_manage_forms'),
  asyncHandler(formsController.ingestAll)
);

router.post('/ingest/:formType',
  authenticate,
  requirePermission('can_manage_forms'),
  asyncHandler(formsController.ingestFormType)
);

// Polling controls - REQUIRES authentication and admin permission
router.post('/polling/start',
  authenticate,
  requirePermission('can_manage_forms'),
  asyncHandler(formsController.startPolling)
);

router.post('/polling/stop',
  authenticate,
  requirePermission('can_manage_forms'),
  asyncHandler(formsController.stopPolling)
);

module.exports = router;
