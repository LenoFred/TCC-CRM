/**
 * Settings Controller
 * Handles system settings and integration status checks
 */

const logger = require('../../utils/logger');

class SettingsController {
  /**
   * Check integration status
   * @route GET /api/settings/integrations/status
   */
  async getIntegrationStatus(req, res) {
    try {
      const integrations = {
        googleSheets: {
          name: "Google Sheets",
          status: !!process.env.GOOGLE_SHEET_ID && !!process.env.GOOGLE_CREDENTIALS_PATH ? "connected" : "disconnected",
          description: "Main database and member management",
          configured: !!process.env.GOOGLE_SHEET_ID
        },
        googleForms: {
          name: "Google Forms",
          status: !!process.env.FORM_RESPONSES_SHEET_ID && process.env.FORM_INGESTION_ENABLED === 'true' ? "connected" : "disconnected",
          description: "Form submissions for members, guests, and volunteers",
          configured: !!process.env.FORM_RESPONSES_SHEET_ID
        },
        whatsapp: {
          name: "WhatsApp Business (Meta)",
          status: !!process.env.WHATSAPP_META_PHONE_NUMBER_ID && !!process.env.WHATSAPP_META_ACCESS_TOKEN ? "connected" : "disconnected",
          description: "Bulk messaging via Meta Cloud API",
          configured: !!process.env.WHATSAPP_META_PHONE_NUMBER_ID
        },
        email: {
          name: "Gmail SMTP",
          status: !!process.env.GMAIL_SMTP_USER && !!process.env.GMAIL_SMTP_APP_PASSWORD ? "connected" : "disconnected",
          description: "Automated email notifications",
          configured: !!process.env.GMAIL_SMTP_USER
        },
        sms: {
          name: "BulkSMS Nigeria",
          status: !!process.env.BULKSMS_NIGERIA_API_TOKEN ? "connected" : "disconnected",
          description: "SMS messaging service",
          configured: !!process.env.BULKSMS_NIGERIA_API_TOKEN
        }
      };

      res.json({
        success: true,
        integrations
      });
    } catch (error) {
      logger.error('Error checking integration status', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to check integration status',
        error: error.message
      });
    }
  }
}

module.exports = new SettingsController();
