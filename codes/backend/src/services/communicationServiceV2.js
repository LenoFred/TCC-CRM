/**
 * Simplified Communication Service (v2)
 * 
 * APPROVED PROVIDERS ONLY:
 * - SMS: BulkSMS Nigeria
 * - WhatsApp: Meta WhatsApp Cloud API (TEMPLATE-BASED ONLY)
 * - Email: Gmail SMTP (NO SendGrid)
 * 
 * Template-first approach - all messages use Communication_Templates
 */

const axios = require('axios');
const nodemailer = require('nodemailer');
const sheetsService = require('./sheetsService');
const templateService = require('./templateService');
const { generateId } = require('../utils/idGenerator');
const { logger } = require('../utils/logger');
const { ApiError } = require('../middlewares/errorHandler');

class SimplifiedCommunicationService {
  constructor() {
    // Meta WhatsApp Cloud API (Template-based only)
    this.whatsappEnabled = false;
    this.whatsappPhoneNumberId = process.env.WHATSAPP_META_PHONE_NUMBER_ID || '';
    this.whatsappAccessToken = process.env.WHATSAPP_META_ACCESS_TOKEN || '';

    // Gmail SMTP (Single email provider)
    this.gmailEnabled = false;
    this.gmailUser = process.env.GMAIL_SMTP_USER || '';
    this.gmailPassword = process.env.GMAIL_SMTP_APP_PASSWORD || '';
    this.gmailFromName = process.env.GMAIL_SMTP_FROM_NAME || 'The Covenant Church';
    this.gmailTransporter = null;

    // BulkSMS Nigeria (Single SMS provider)
    this.bulksmsEnabled = false;
    this.bulksmsApiToken = process.env.BULKSMS_NIGERIA_API_TOKEN || '';
    this.bulksmsSenderName = process.env.BULKSMS_NIGERIA_SENDER_NAME || 'TCC';
    this.bulksmsDndEnabled = process.env.BULKSMS_NIGERIA_DND_ENABLED === 'true';

    this.initialize();
  }

  /**
   * Initialize communication services (simplified)
   */
  initialize() {
    // Initialize Meta WhatsApp
    if (this.whatsappPhoneNumberId && this.whatsappAccessToken) {
      this.whatsappEnabled = true;
      logger.info('✓ Meta WhatsApp Cloud API initialized (template-based only)');
    } else {
      logger.warn('⚠ Meta WhatsApp not configured');
    }

    // Initialize Gmail SMTP
    if (this.gmailUser && this.gmailPassword) {
      try {
        this.gmailTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: this.gmailUser,
            pass: this.gmailPassword,
          },
        });
        this.gmailEnabled = true;
        logger.info('✓ Gmail SMTP initialized');
      } catch (error) {
        logger.error('Failed to initialize Gmail SMTP', { error: error.message });
      }
    } else {
      logger.warn('⚠ Gmail SMTP not configured');
    }

    // Initialize BulkSMS Nigeria
    if (this.bulksmsApiToken) {
      this.bulksmsEnabled = true;
      logger.info('✓ BulkSMS Nigeria initialized');
    } else {
      logger.warn('⚠ BulkSMS Nigeria not configured');
    }
  }

  /**
   * Format phone number to Nigerian E.164 format
   * Example: 08012345678 → +2348012345678
   */
  formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.substring(1);
    }
    
    if (!cleaned.startsWith('234')) {
      cleaned = '234' + cleaned;
    }
    
    return '+' + cleaned;
  }

  /**
   * Send template-based message
   * This is the PRIMARY method for all communications
   */
  async sendTemplateMessage(options) {
    const {
      templateID,
      recipient,
      variables,
      scheduledMessageID = null,
      sentBy = '',
      sentByName = ''
    } = options;

    try {
      // Render template with variables
      const rendered = await templateService.renderTemplate(templateID, variables);
      
      // Route to appropriate channel
      const channel = rendered.channel.toLowerCase();
      
      let result;
      if (channel === 'sms') {
        result = await this.sendSMS({
          to: recipient.phone,
          message: rendered.message,
          recipientID: recipient.memberID || recipient.guestID || '',
          recipientName: recipient.name || '',
          recipientPhone: recipient.phone,
          sentBy,
          sentByName,
          scheduledMessageID
        });
      } else if (channel === 'whatsapp') {
        result = await this.sendWhatsApp({
          to: recipient.phone,
          message: rendered.message,
          whatsAppTemplateID: rendered.whatsAppTemplateID,
          recipientID: recipient.memberID || recipient.guestID || '',
          recipientName: recipient.name || '',
          recipientPhone: recipient.phone,
          sentBy,
          sentByName,
          scheduledMessageID
        });
      } else if (channel === 'email') {
        result = await this.sendEmail({
          to: recipient.email,
          subject: rendered.subject,
          htmlContent: rendered.message,
          recipientID: recipient.memberID || recipient.guestID || '',
          recipientName: recipient.name || '',
          recipientEmail: recipient.email,
          sentBy,
          sentByName,
          scheduledMessageID
        });
      } else {
        throw new ApiError(400, `Unsupported channel: ${channel}`);
      }

      return result;
    } catch (error) {
      logger.error('Error sending template message', {
        templateID,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send SMS via BulkSMS Nigeria
   */
  async sendSMS(options) {
    const {
      to,
      message,
      recipientID = '',
      recipientName = '',
      recipientPhone = '',
      sentBy = '',
      sentByName = '',
      scheduledMessageID = null
    } = options;

    try {
      const formattedPhone = this.formatPhoneNumber(to);
      logger.info('Sending SMS via BulkSMS Nigeria', { to: formattedPhone });

      // Record in Communications sheet
      const communication = await this.recordCommunication({
        recipientID,
        recipientName,
        recipientPhone: formattedPhone,
        recipientEmail: '',
        messageType: 'SMS',
        emailProvider: '',
        subject: '',
        message,
        status: 'Pending',
        sentBy,
        sentByName,
        scheduledMessageID,
        cost: 0
      });

      if (!this.bulksmsEnabled) {
        await this.updateCommunicationStatus(communication.communicationID, 'Failed', {
          failureReason: 'BulkSMS Nigeria not configured'
        });
        
        return {
          success: false,
          message: 'SMS service not configured',
          communication
        };
      }

      try {
        const response = await axios.post(
          'https://www.bulksmsnigeria.com/api/v1/sms/create',
          {
            api_token: this.bulksmsApiToken,
            from: this.bulksmsSenderName,
            to: formattedPhone,
            body: message,
            dnd: this.bulksmsDndEnabled ? '2' : '1'
          }
        );

        if (response.data && response.data.status === 'success') {
          const cost = parseFloat(response.data.data.cost || 0);
          
          await this.updateCommunicationStatus(communication.communicationID, 'Sent', {
            sentAt: new Date().toISOString(),
            externalMessageID: response.data.data.message_id,
            cost: cost
          });

          logger.info('SMS sent successfully', {
            messageId: response.data.data.message_id,
            cost
          });

          return {
            success: true,
            messageId: response.data.data.message_id,
            communication,
            cost
          };
        } else {
          throw new Error(response.data.message || 'Failed to send SMS');
        }
      } catch (apiError) {
        const errorMessage = apiError.response?.data?.message || apiError.message;
        logger.error('BulkSMS API error', { error: errorMessage });
        
        await this.updateCommunicationStatus(communication.communicationID, 'Failed', {
          failureReason: errorMessage
        });

        return {
          success: false,
          message: errorMessage,
          communication
        };
      }
    } catch (error) {
      logger.error('Error sending SMS', { error: error.message });
      throw error;
    }
  }

  /**
   * Send WhatsApp message via Meta Cloud API
   * TEMPLATE-BASED ONLY - No freeform messages
   */
  async sendWhatsApp(options) {
    const {
      to,
      message,
      whatsAppTemplateID,
      recipientID = '',
      recipientName = '',
      recipientPhone = '',
      sentBy = '',
      sentByName = '',
      scheduledMessageID = null
    } = options;

    try {
      const formattedPhone = this.formatPhoneNumber(to);
      logger.info('Sending WhatsApp via Meta Cloud API', { to: formattedPhone });

      // ENFORCE TEMPLATE REQUIREMENT
      if (!whatsAppTemplateID || whatsAppTemplateID.trim() === '') {
        throw new ApiError(
          400,
          'WhatsApp messages REQUIRE an approved template ID. Please use a template with WhatsAppTemplateID set.'
        );
      }

      // Record in Communications sheet
      const communication = await this.recordCommunication({
        recipientID,
        recipientName,
        recipientPhone: formattedPhone,
        recipientEmail: '',
        messageType: 'WhatsApp',
        emailProvider: '',
        subject: '',
        message,
        status: 'Pending',
        sentBy,
        sentByName,
        scheduledMessageID,
        cost: 0
      });

      if (!this.whatsappEnabled) {
        await this.updateCommunicationStatus(communication.communicationID, 'Failed', {
          failureReason: 'Meta WhatsApp not configured'
        });
        
        return {
          success: false,
          message: 'WhatsApp service not configured',
          communication
        };
      }

      try {
        const response = await axios.post(
          `https://graph.facebook.com/v21.0/${this.whatsappPhoneNumberId}/messages`,
          {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: {
              body: message
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.whatsappAccessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data && response.data.messages && response.data.messages[0].id) {
          await this.updateCommunicationStatus(communication.communicationID, 'Sent', {
            sentAt: new Date().toISOString(),
            externalMessageID: response.data.messages[0].id
          });

          logger.info('WhatsApp sent successfully', {
            messageId: response.data.messages[0].id
          });

          return {
            success: true,
            messageId: response.data.messages[0].id,
            communication
          };
        } else {
          throw new Error('Invalid response from Meta WhatsApp API');
        }
      } catch (apiError) {
        const errorMessage = apiError.response?.data?.error?.message || apiError.message;
        logger.error('Meta WhatsApp API error', { error: errorMessage });
        
        await this.updateCommunicationStatus(communication.communicationID, 'Failed', {
          failureReason: errorMessage
        });

        return {
          success: false,
          message: errorMessage,
          communication
        };
      }
    } catch (error) {
      logger.error('Error sending WhatsApp', { error: error.message });
      throw error;
    }
  }

  /**
   * Send Email via Gmail SMTP (ONLY provider)
   */
  async sendEmail(options) {
    const {
      to,
      subject,
      htmlContent,
      recipientID = '',
      recipientName = '',
      recipientEmail = '',
      sentBy = '',
      sentByName = '',
      scheduledMessageID = null,
      attachments = []
    } = options;

    try {
      logger.info('Sending Email via Gmail SMTP', { to, subject });

      // Record in Communications sheet
      const communication = await this.recordCommunication({
        recipientID,
        recipientName,
        recipientPhone: '',
        recipientEmail: to,
        messageType: 'Email',
        emailProvider: 'Gmail SMTP',
        subject,
        message: htmlContent,
        status: 'Pending',
        sentBy,
        sentByName,
        scheduledMessageID,
        cost: 0
      });

      if (!this.gmailEnabled) {
        await this.updateCommunicationStatus(communication.communicationID, 'Failed', {
          failureReason: 'Gmail SMTP not configured'
        });
        
        return {
          success: false,
          message: 'Email service not configured',
          communication
        };
      }

      try {
        const mailOptions = {
          from: `"${this.gmailFromName}" <${this.gmailUser}>`,
          to: to,
          subject: subject,
          html: htmlContent,
          ...(attachments.length > 0 && { attachments })
        };

        const result = await this.gmailTransporter.sendMail(mailOptions);

        await this.updateCommunicationStatus(communication.communicationID, 'Sent', {
          sentAt: new Date().toISOString(),
          externalMessageID: result.messageId
        });

        logger.info('Email sent successfully via Gmail SMTP', {
          messageId: result.messageId
        });

        return {
          success: true,
          messageId: result.messageId,
          communication
        };
      } catch (smtpError) {
        logger.error('Gmail SMTP error', { error: smtpError.message });
        
        await this.updateCommunicationStatus(communication.communicationID, 'Failed', {
          failureReason: smtpError.message
        });

        return {
          success: false,
          message: smtpError.message,
          communication
        };
      }
    } catch (error) {
      logger.error('Error sending email', { error: error.message });
      throw error;
    }
  }

  /**
   * Send bulk messages using template
   */
  async sendBulkTemplateMessage(options) {
    const {
      templateID,
      recipients,
      variables = {},
      sentBy = '',
      sentByName = ''
    } = options;

    try {
      const results = {
        total: recipients.length,
        sent: 0,
        failed: 0,
        details: []
      };

      for (const recipient of recipients) {
        try {
          // Merge global variables with recipient-specific ones
          const recipientVars = {
            ...variables,
            first_name: recipient.firstName || recipient.name || '',
            last_name: recipient.surname || recipient.lastName || '',
            ...recipient.customVariables
          };

          const result = await this.sendTemplateMessage({
            templateID,
            recipient,
            variables: recipientVars,
            sentBy,
            sentByName
          });

          if (result.success) {
            results.sent++;
          } else {
            results.failed++;
          }

          results.details.push({
            recipient: recipient.name || recipient.email || recipient.phone,
            success: result.success,
            message: result.message,
            communicationID: result.communication?.communicationID
          });
        } catch (error) {
          results.failed++;
          results.details.push({
            recipient: recipient.name || recipient.email || recipient.phone,
            success: false,
            message: error.message
          });
        }
      }

      logger.info('Bulk template message completed', {
        templateID,
        total: results.total,
        sent: results.sent,
        failed: results.failed
      });

      return results;
    } catch (error) {
      logger.error('Error sending bulk template message', { error: error.message });
      throw error;
    }
  }

  /**
   * Record communication in Communications sheet
   */
  async recordCommunication(data) {
    try {
      const communication = {
        communicationID: generateId('COM'),
        recipientID: data.recipientID || '',
        recipientType: data.recipientType || 'Individual',
        recipientName: data.recipientName || '',
        recipientPhone: data.recipientPhone || '',
        recipientEmail: data.recipientEmail || '',
        messageType: data.messageType,
        emailProvider: data.emailProvider || '',
        subject: data.subject || '',
        message: data.message || '',
        status: data.status || 'Pending',
        sentBy: data.sentBy || '',
        sentByName: data.sentByName || '',
        sentAt: data.sentAt || '',
        deliveredAt: '',
        failureReason: '',
        externalMessageID: '',
        cost: data.cost || 0,
        groupIDs: data.groupIDs || '',
        tags: data.tags || '',
        scheduledMessageID: data.scheduledMessageID || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await sheetsService.appendRows(sheetsService.SHEETS.COMMUNICATIONS, [communication]);
      
      return communication;
    } catch (error) {
      logger.error('Error recording communication', { error: error.message });
      throw error;
    }
  }

  /**
   * Update communication status
   */
  async updateCommunicationStatus(communicationID, status, updates = {}) {
    try {
      const communications = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.COMMUNICATIONS
      );
      
      const index = communications.findIndex(
        c => c.communicationID === communicationID
      );
      
      if (index === -1) {
        throw new Error(`Communication ${communicationID} not found`);
      }

      communications[index] = {
        ...communications[index],
        status,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const headers = Object.keys(communications[0]);
      const rows = [
        headers,
        ...communications.map(c => headers.map(h => c[h] || ''))
      ];

      await sheetsService.updateSheetData(sheetsService.SHEETS.COMMUNICATIONS, rows);
      sheetsService.invalidateCache(sheetsService.SHEETS.COMMUNICATIONS);

      return communications[index];
    } catch (error) {
      logger.error('Error updating communication status', { error: error.message });
      throw error;
    }
  }

  /**
   * Get service status
   */
  getServiceStatus() {
    return {
      sms: {
        enabled: this.bulksmsEnabled,
        provider: 'BulkSMS Nigeria',
        configured: !!this.bulksmsApiToken
      },
      whatsapp: {
        enabled: this.whatsappEnabled,
        provider: 'Meta WhatsApp Cloud API',
        configured: !!(this.whatsappPhoneNumberId && this.whatsappAccessToken),
        templateOnly: true
      },
      email: {
        enabled: this.gmailEnabled,
        provider: 'Gmail SMTP',
        configured: !!(this.gmailUser && this.gmailPassword)
      }
    };
  }
}

module.exports = new SimplifiedCommunicationService();
