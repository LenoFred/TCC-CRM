const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const schedulerService = require('../../services/schedulerService');
const { ApiError } = require('../../middlewares/errorHandler');
const { logger } = require('../../utils/logger');
const { generateId } = require('../../utils/idGenerator');

/**
 * AutomatedMessages Controller
 * Handles automated message configurations
 */
class AutomatedMessagesController extends BaseController {
  constructor() {
    super(sheetsService, 'AutomatedMessages', 'AutomatedMessage');
  }

  /**
   * Get default headers for AutomatedMessages sheet
   */
  getDefaultHeaders() {
    return [
      'AutomationID',
      'Name',
      'Type',
      'TriggerTime',
      'Channel',
      'EmailProvider',
      'Subject',
      'Message',
      'Recurring',
      'Enabled',
      'TargetMembers',
      'TargetGuests',
      'TargetVolunteers',
      'CreatedBy',
      'CreatedByName',
      'LastRun',
      'NextRun',
      'CreatedAt',
      'UpdatedAt',
      'IsSystem'
    ];
  }

  /**
   * Transform row data to object
   */
  transformRowToObject(row, headers) {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  }

  /**
   * Transform object to row
   */
  transformObjectToRow(obj, headers) {
    return headers.map(header => obj[header] || '');
  }

  /**
   * Create new automated message configuration
   */
  async create(req, res) {
    try {
      const { 
        name, 
        type, 
        triggerTime, 
        channel, 
        emailProvider,
        subject,
        message, 
        recurring,
        enabled,
        targetMembers,
        targetGuests,
        targetVolunteers 
      } = req.body;

      // Validation
      if (!name || !type || !channel || !message) {
        throw new ApiError('Name, type, channel, and message are required', 400);
      }

      // Check for birthday without recurring
      if (type === 'birthday' && !recurring) {
        // Return warning to frontend - will be handled by confirmation dialog
        return res.status(200).json({
          success: true,
          warning: 'birthday_no_recurring',
          message: 'Birthday automations are typically recurring. Are you sure you want to create a one-time birthday message?',
          data: req.body
        });
      }

      const automationID = generateId('AUTO');
      const now = new Date().toISOString();
      const currentUser = req.user;

      const newAutomation = [
        automationID,
        name,
        type,
        triggerTime || 'instant',
        channel,
        emailProvider || '',
        subject || '',
        message,
        recurring ? 'TRUE' : 'FALSE',
        enabled !== false ? 'TRUE' : 'FALSE',
        targetMembers !== false ? 'TRUE' : 'FALSE',
        targetGuests === true ? 'TRUE' : 'FALSE',
        targetVolunteers === true ? 'TRUE' : 'FALSE',
        currentUser?.staffID || '',
        currentUser?.name || '',
        '', // LastRun
        '', // NextRun
        now,
        now
      ];

      await sheetsService.appendSheetData(this.sheetName, [newAutomation]);

      logger.info(`Automated message created: ${automationID}`);

      res.status(201).json({
        success: true,
        message: 'Automated message configuration created successfully',
        data: {
          automationID,
          name,
          type,
          enabled: enabled !== false
        }
      });

    } catch (error) {
      logger.error('Error creating automated message:', error);
      throw error;
    }
  }

  /**
   * Get all automated message configurations
   */
  async getAll(req, res) {
    try {
      const data = await sheetsService.getSheetObjects(this.sheetName);
      
      res.status(200).json({
        success: true,
        data: data || [],
        total: data?.length || 0
      });

    } catch (error) {
      logger.error('Error fetching automated messages:', error);
      throw error;
    }
  }

  /**
   * Get automated message by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await sheetsService.getSheetData(this.sheetName);
      const automation = data.find(a => a.AutomationID === id);

      if (!automation) {
        throw new ApiError('Automated message not found', 404);
      }

      res.status(200).json({
        success: true,
        data: automation
      });

    } catch (error) {
      logger.error('Error fetching automated message:', error);
      throw error;
    }
  }

  /**
   * Update automated message configuration
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check for birthday without recurring
      if (updates.type === 'birthday' && updates.recurring === false) {
        return res.status(200).json({
          success: true,
          warning: 'birthday_no_recurring',
          message: 'Birthday automations are typically recurring. Are you sure you want to disable recurring?',
          data: { id, ...updates }
        });
      }

      updates.UpdatedAt = new Date().toISOString();

      // Convert boolean values to TRUE/FALSE strings for sheets
      if (updates.recurring !== undefined) {
        updates.Recurring = updates.recurring ? 'TRUE' : 'FALSE';
      }
      if (updates.enabled !== undefined) {
        updates.Enabled = updates.enabled ? 'TRUE' : 'FALSE';
      }

      await sheetsService.updateSheetRow(this.sheetName, id, updates);

      logger.info(`Automated message updated: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Automated message configuration updated successfully'
      });

    } catch (error) {
      logger.error('Error updating automated message:', error);
      throw error;
    }
  }

  /**
   * Delete automated message configuration
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      // Check if this is a system automation
      const automations = await sheetsService.getSheetData(this.sheetName);
      const automation = automations.find(a => a.AutomationID === id);

      if (!automation) {
        throw new ApiError('Automation not found', 404);
      }

      if (automation.IsSystem === 'TRUE') {
        throw new ApiError('Cannot delete system automations. You can disable them instead.', 403);
      }

      await sheetsService.deleteSheetRow(this.sheetName, id, 'AutomationID');

      logger.info(`Automated message deleted: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Automated message configuration deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting automated message:', error);
      throw error;
    }
  }

  /**
   * Toggle automation enabled status
   */
  async toggle(req, res) {
    try {
      const { id } = req.params;
      const { enabled } = req.body;

      await sheetsService.updateRow(
        this.sheetName,
        'AutomationID',
        id,
        {
          Enabled: enabled ? 'TRUE' : 'FALSE',
          UpdatedAt: new Date().toISOString()
        }
      );

      logger.info(`Automated message ${enabled ? 'enabled' : 'disabled'}: ${id}`);

      res.status(200).json({
        success: true,
        message: `Automation ${enabled ? 'enabled' : 'disabled'} successfully`
      });

    } catch (error) {
      logger.error('Error toggling automation:', error);
      throw error;
    }
  }

  /**
   * Test automation by sending to specific recipient
   */
  async test(req, res) {
    try {
      const { id } = req.params;
      const { testRecipient } = req.body;

      if (!testRecipient) {
        throw new ApiError('Test recipient is required', 400);
      }

      // Get automation config
      const data = await sheetsService.getSheetData(this.sheetName);
      const automation = data.find(a => a.AutomationID === id);

      if (!automation) {
        throw new ApiError('Automation not found', 404);
      }

      // Prepare test message
      const testData = {
        firstName: 'Test',
        lastName: 'User',
        email: testRecipient,
        phoneNumber: testRecipient
      };

      const message = schedulerService.replacePlaceholders(automation.Message, testData);

      // Send test message
      const communicationService = require('../../services/communicationService');
      const channels = automation.Channel.split(',').map(c => c.trim());

      for (const channel of channels) {
        const requestData = {
          recipientType: 'individual',
          recipients: [testRecipient],
          message: message,
          channel: channel
        };

        if (channel === 'email') {
          requestData.subject = automation.Subject || 'Test Message from TCC CRM';
          requestData.emailProvider = automation.EmailProvider || 'gmail';
        }

        await communicationService.sendBulkMessage(requestData);
      }

      logger.info(`Test message sent for automation: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Test message sent successfully'
      });

    } catch (error) {
      logger.error('Error sending test message:', error);
      throw error;
    }
  }

  /**
   * Get pending automations for today
   */
  async getPendingToday(req, res) {
    try {
      const pending = await schedulerService.getPendingMessagesForToday();

      res.status(200).json({
        success: true,
        data: pending || [],
        total: pending?.length || 0
      });

    } catch (error) {
      logger.error('Error fetching pending automations:', error);
      throw error;
    }
  }

  /**
   * Get pending automations for this week
   */
  async getPendingWeek(req, res) {
    try {
      const pending = await schedulerService.getPendingMessagesForWeek();

      res.status(200).json({
        success: true,
        data: pending || [],
        total: pending?.length || 0
      });

    } catch (error) {
      logger.error('Error fetching pending automations:', error);
      throw error;
    }
  }

  /**
   * Get failed automations
   */
  async getFailed(req, res) {
    try {
      const data = await sheetsService.getSheetData('FailedAutomations');

      res.status(200).json({
        success: true,
        data: data || [],
        total: data?.length || 0
      });

    } catch (error) {
      logger.error('Error fetching failed automations:', error);
      throw error;
    }
  }
}

module.exports = new AutomatedMessagesController();
