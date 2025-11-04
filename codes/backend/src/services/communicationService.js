/**
 * Communication Service
 * Handles SMS, Email, and WhatsApp communications
 * Integrates with Twilio (SMS/WhatsApp) and Nodemailer (Email)
 */

const sheetsService = require('./sheetsService');
const { generateId } = require('../utils/idGenerator');
const { logger } = require('../utils/logger');
const { ApiError } = require('../middlewares/errorHandler');
const config = require('../config');

// Placeholder imports - uncomment when ready to use
// const twilio = require('twilio');
// const nodemailer = require('nodemailer');

class CommunicationService {
  constructor() {
    // Twilio client (placeholder)
    this.twilioClient = null;
    this.twilioEnabled = false;

    // Nodemailer transporter (placeholder)
    this.emailTransporter = null;
    this.emailEnabled = false;

    this.initializeServices();
  }

  /**
   * Initialize communication services
   */
  initializeServices() {
    // Initialize Twilio
    if (config.communications.twilio.accountSid && config.communications.twilio.authToken) {
      try {
        // Uncomment when ready:
        // this.twilioClient = twilio(
        //   config.communications.twilio.accountSid,
        //   config.communications.twilio.authToken
        // );
        // this.twilioEnabled = true;
        logger.info('Twilio service initialized (placeholder)');
      } catch (error) {
        logger.error('Failed to initialize Twilio', { error: error.message });
      }
    }

    // Initialize Nodemailer
    if (config.communications.email.host && config.communications.email.user) {
      try {
        // Uncomment when ready:
        // this.emailTransporter = nodemailer.createTransport({
        //   host: config.communications.email.host,
        //   port: config.communications.email.port,
        //   secure: config.communications.email.secure,
        //   auth: {
        //     user: config.communications.email.user,
        //     pass: config.communications.email.pass,
        //   },
        // });
        // this.emailEnabled = true;
        logger.info('Email service initialized (placeholder)');
      } catch (error) {
        logger.error('Failed to initialize Email service', { error: error.message });
      }
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS(to, message, options = {}) {
    try {
      logger.info('Sending SMS', { to, message: message.substring(0, 50) });

      // Record in database
      const communication = await this.recordCommunication({
        recipientID: options.recipientID || '',
        recipientType: 'Individual',
        messageType: 'SMS',
        subject: '',
        message,
        sentBy: options.sentBy || '',
      });

      // TODO: Uncomment when Twilio is configured
      // if (this.twilioEnabled) {
      //   const result = await this.twilioClient.messages.create({
      //     body: message,
      //     from: config.communications.twilio.phoneNumber,
      //     to: to,
      //   });
      //
      //   await this.updateCommunicationStatus(communication.communicationID, 'Sent', {
      //     sentAt: new Date().toISOString(),
      //   });
      //
      //   logger.info('SMS sent successfully', { messageId: result.sid });
      //   return { success: true, messageId: result.sid, communication };
      // }

      // Placeholder response
      logger.warn('SMS not sent - Twilio not configured');
      await this.updateCommunicationStatus(communication.communicationID, 'Failed', {
        failureReason: 'Twilio not configured',
      });

      return {
        success: false,
        message: 'SMS service not configured',
        communication,
      };
    } catch (error) {
      logger.error('Error sending SMS', { error: error.message });
      throw error;
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsApp(to, message, options = {}) {
    try {
      logger.info('Sending WhatsApp', { to, message: message.substring(0, 50) });

      // Record in database
      const communication = await this.recordCommunication({
        recipientID: options.recipientID || '',
        recipientType: 'Individual',
        messageType: 'WhatsApp',
        subject: '',
        message,
        sentBy: options.sentBy || '',
      });

      // TODO: Uncomment when Twilio WhatsApp is configured
      // if (this.twilioEnabled) {
      //   const result = await this.twilioClient.messages.create({
      //     body: message,
      //     from: `whatsapp:${config.communications.twilio.whatsappNumber}`,
      //     to: `whatsapp:${to}`,
      //   });
      //
      //   await this.updateCommunicationStatus(communication.communicationID, 'Sent', {
      //     sentAt: new Date().toISOString(),
      //   });
      //
      //   logger.info('WhatsApp sent successfully', { messageId: result.sid });
      //   return { success: true, messageId: result.sid, communication };
      // }

      // Placeholder response
      logger.warn('WhatsApp not sent - Twilio not configured');
      await this.updateCommunicationStatus(communication.communicationID, 'Failed', {
        failureReason: 'Twilio WhatsApp not configured',
      });

      return {
        success: false,
        message: 'WhatsApp service not configured',
        communication,
      };
    } catch (error) {
      logger.error('Error sending WhatsApp', { error: error.message });
      throw error;
    }
  }

  /**
   * Send Email
   */
  async sendEmail(to, subject, htmlContent, options = {}) {
    try {
      logger.info('Sending Email', { to, subject });

      // Record in database
      const communication = await this.recordCommunication({
        recipientID: options.recipientID || '',
        recipientType: 'Individual',
        messageType: 'Email',
        subject,
        message: htmlContent,
        sentBy: options.sentBy || '',
      });

      // TODO: Uncomment when Nodemailer is configured
      // if (this.emailEnabled) {
      //   const result = await this.emailTransporter.sendMail({
      //     from: `"${config.communications.email.fromName}" <${config.communications.email.user}>`,
      //     to: to,
      //     subject: subject,
      //     html: htmlContent,
      //     ...(options.attachments && { attachments: options.attachments }),
      //   });
      //
      //   await this.updateCommunicationStatus(communication.communicationID, 'Sent', {
      //     sentAt: new Date().toISOString(),
      //   });
      //
      //   logger.info('Email sent successfully', { messageId: result.messageId });
      //   return { success: true, messageId: result.messageId, communication };
      // }

      // Placeholder response
      logger.warn('Email not sent - Nodemailer not configured');
      await this.updateCommunicationStatus(communication.communicationID, 'Failed', {
        failureReason: 'Email service not configured',
      });

      return {
        success: false,
        message: 'Email service not configured',
        communication,
      };
    } catch (error) {
      logger.error('Error sending Email', { error: error.message });
      throw error;
    }
  }

  /**
   * Send bulk messages
   */
  async sendBulkMessages(recipients, messageType, message, options = {}) {
    try {
      logger.info('Sending bulk messages', {
        recipientCount: recipients.length,
        messageType,
      });

      const results = {
        successful: [],
        failed: [],
      };

      for (const recipient of recipients) {
        try {
          let result;

          switch (messageType.toLowerCase()) {
            case 'sms':
              result = await this.sendSMS(recipient.phone, message, {
                recipientID: recipient.memberID,
                sentBy: options.sentBy,
              });
              break;

            case 'whatsapp':
              result = await this.sendWhatsApp(recipient.phone, message, {
                recipientID: recipient.memberID,
                sentBy: options.sentBy,
              });
              break;

            case 'email':
              result = await this.sendEmail(
                recipient.email,
                options.subject || 'Message from TCC',
                message,
                {
                  recipientID: recipient.memberID,
                  sentBy: options.sentBy,
                }
              );
              break;

            default:
              throw new Error('Invalid message type');
          }

          results.successful.push({
            recipient: recipient.memberID,
            result,
          });
        } catch (error) {
          results.failed.push({
            recipient: recipient.memberID,
            error: error.message,
          });
        }
      }

      logger.info('Bulk messaging completed', {
        successful: results.successful.length,
        failed: results.failed.length,
      });

      return results;
    } catch (error) {
      logger.error('Error sending bulk messages', { error: error.message });
      throw error;
    }
  }

  /**
   * Record communication in database
   */
  async recordCommunication(data) {
    try {
      const communications = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.COMMUNICATIONS
      );

      const communication = {
        communicationID: generateId('COM'),
        recipientID: data.recipientID || '',
        recipientType: data.recipientType || 'Individual',
        messageType: data.messageType || 'Email',
        subject: data.subject || '',
        message: data.message || '',
        status: 'Pending',
        sentBy: data.sentBy || '',
        sentAt: '',
        deliveredAt: '',
        failureReason: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      communications.push(communication);

      const headers = [
        'CommunicationID',
        'RecipientID',
        'RecipientType',
        'MessageType',
        'Subject',
        'Message',
        'Status',
        'SentBy',
        'SentAt',
        'DeliveredAt',
        'FailureReason',
        'CreatedAt',
        'UpdatedAt',
      ];

      const rows = [
        headers,
        ...communications.map((c) =>
          headers.map((h) => {
            const key = h.charAt(0).toLowerCase() + h.slice(1);
            return c[key] || '';
          })
        ),
      ];

      await sheetsService.updateSheetData(
        sheetsService.SHEETS.COMMUNICATIONS,
        rows
      );
      sheetsService.invalidateCache(sheetsService.SHEETS.COMMUNICATIONS);

      return communication;
    } catch (error) {
      logger.error('Error recording communication', { error: error.message });
      throw error;
    }
  }

  /**
   * Update communication status
   */
  async updateCommunicationStatus(communicationID, status, extraData = {}) {
    try {
      const communications = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.COMMUNICATIONS
      );
      const index = communications.findIndex(
        (c) => c.communicationID === communicationID
      );

      if (index === -1) {
        throw new ApiError('Communication not found', 404);
      }

      communications[index] = {
        ...communications[index],
        status,
        ...extraData,
        updatedAt: new Date().toISOString(),
      };

      const headers = [
        'CommunicationID',
        'RecipientID',
        'RecipientType',
        'MessageType',
        'Subject',
        'Message',
        'Status',
        'SentBy',
        'SentAt',
        'DeliveredAt',
        'FailureReason',
        'CreatedAt',
        'UpdatedAt',
      ];

      const rows = [
        headers,
        ...communications.map((c) =>
          headers.map((h) => {
            const key = h.charAt(0).toLowerCase() + h.slice(1);
            return c[key] || '';
          })
        ),
      ];

      await sheetsService.updateSheetData(
        sheetsService.SHEETS.COMMUNICATIONS,
        rows
      );
      sheetsService.invalidateCache(sheetsService.SHEETS.COMMUNICATIONS);

      return communications[index];
    } catch (error) {
      logger.error('Error updating communication status', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send templated message
   */
  async sendTemplatedMessage(templateName, recipient, data, messageType = 'email') {
    try {
      const templates = {
        welcome: {
          subject: 'Welcome to The Covenant Church!',
          message: `
            <h1>Welcome ${data.firstName}!</h1>
            <p>We're thrilled to have you join our church family.</p>
            <p>Your member ID is: ${data.memberID}</p>
            <p>We look forward to seeing you at our next service!</p>
          `,
        },
        guestFollowUp: {
          subject: 'Thank you for visiting!',
          message: `
            <h1>Hi ${data.firstName},</h1>
            <p>Thank you for visiting The Covenant Church on ${data.visitDate}.</p>
            <p>We hope to see you again soon!</p>
          `,
        },
        donationReceipt: {
          subject: 'Donation Receipt',
          message: `
            <h1>Thank you for your donation!</h1>
            <p>Receipt Number: ${data.receiptNumber}</p>
            <p>Amount: ${data.amount} ${data.currency}</p>
            <p>Date: ${data.date}</p>
            <p>Your generosity helps us serve the community better.</p>
          `,
        },
        eventReminder: {
          subject: `Reminder: ${data.eventName}`,
          message: `
            <h1>Event Reminder</h1>
            <p>Don't forget about ${data.eventName}!</p>
            <p>Date: ${data.date}</p>
            <p>Time: ${data.time}</p>
            <p>Location: ${data.location}</p>
          `,
        },
      };

      const template = templates[templateName];
      if (!template) {
        throw new ApiError('Template not found', 404);
      }

      if (messageType.toLowerCase() === 'email') {
        return await this.sendEmail(
          recipient.email,
          template.subject,
          template.message,
          { recipientID: recipient.memberID }
        );
      } else if (messageType.toLowerCase() === 'sms') {
        // Strip HTML and send as SMS
        const textMessage = template.message.replace(/<[^>]*>/g, '').trim();
        return await this.sendSMS(recipient.phone, textMessage, {
          recipientID: recipient.memberID,
        });
      } else {
        throw new ApiError('Invalid message type', 400);
      }
    } catch (error) {
      logger.error('Error sending templated message', { error: error.message });
      throw error;
    }
  }
}

module.exports = new CommunicationService();
