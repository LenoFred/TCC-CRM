/**
 * Forms Ingestion Routes
 * Routes for manual triggering of form ingestion
 */

const express = require('express');
const router = express.Router();
const formsController = require('../controllers/formsController');

// Manual ingestion triggers
router.post('/ingest/all', formsController.ingestAll);
router.post('/ingest/:formType', formsController.ingestFormType);

// Polling controls
router.post('/polling/start', formsController.startPolling);
router.post('/polling/stop', formsController.stopPolling);

module.exports = router;
