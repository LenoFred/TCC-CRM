/**
 * Forms Ingestion Controller
 * Handles manual triggering of form ingestion
 */

const formIngestionService = require('../../services/formIngestionService');

/**
 * @route   POST /api/forms/ingest/all
 * @desc    Manually trigger ingestion of all forms
 * @access  Private (Admin only)
 */
exports.ingestAll = async (req, res) => {
  try {
    const results = await formIngestionService.ingestAllForms();
    
    res.json({
      success: true,
      message: 'Form ingestion completed',
      results
    });
  } catch (error) {
    console.error('Error ingesting all forms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ingest forms',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/forms/ingest/:formType
 * @desc    Manually trigger ingestion of specific form
 * @access  Private (Admin only)
 * @params  formType: members|guests|volunteers|requests
 */
exports.ingestFormType = async (req, res) => {
  try {
    const { formType } = req.params;
    
    const validTypes = ['members', 'guests', 'volunteers', 'requests'];
    if (!validTypes.includes(formType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid form type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const results = await formIngestionService.ingestFormType(formType);
    
    res.json({
      success: true,
      message: `${formType} ingestion completed`,
      results
    });
  } catch (error) {
    console.error(`Error ingesting ${req.params.formType}:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to ingest ${req.params.formType}`,
      error: error.message
    });
  }
};

/**
 * @route   POST /api/forms/polling/start
 * @desc    Start automatic polling
 * @access  Private (Admin only)
 */
exports.startPolling = async (req, res) => {
  try {
    formIngestionService.startPolling();
    
    res.json({
      success: true,
      message: 'Automatic polling started'
    });
  } catch (error) {
    console.error('Error starting polling:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start polling',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/forms/polling/stop
 * @desc    Stop automatic polling
 * @access  Private (Admin only)
 */
exports.stopPolling = async (req, res) => {
  try {
    formIngestionService.stopPolling();
    
    res.json({
      success: true,
      message: 'Automatic polling stopped'
    });
  } catch (error) {
    console.error('Error stopping polling:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop polling',
      error: error.message
    });
  }
};
