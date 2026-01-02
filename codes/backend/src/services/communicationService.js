/**
 * Communication Service
 * Handles SMS, Email, and WhatsApp communications
 * Integrates with Meta WhatsApp Cloud API, SendGrid, Gmail SMTP, and BulkSMS Nigeria
 */

const axios = require('axios');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const sheetsService = require('./sheetsService');
const { generateId } = require('../utils/idGenerator');
const { logger } = require('../utils/logger');
const { ApiError } = require('../middlewares/errorHandler');
const config = require('../config');

class CommunicationService {
  constructor() {
    // Meta WhatsApp Cloud API
    this.whatsappEnabled = false;
    this.whatsappPhoneNumberId = process.env.WHATSAPP_META_PHONE_NUMBER_ID || '';
    this.whatsappAccessToken = process.env.WHATSAPP_META_ACCESS_TOKEN || '';
    this.whatsappBusinessAccountId = process.env.WHATSAPP_META_BUSINESS_ACCOUNT_ID || '';

    // SendGrid for promotional emails
    this.sendgridEnabled = false;
    this.sendgridApiKey = process.env.SENDGRID_API_KEY || '';
    this.sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL || '';
    this.sendgridFromName = process.env.SENDGRID_FROM_NAME || 'The Covenant Church';

    // Gmail SMTP for automated emails
    this.gmailEnabled = false;
    this.gmailUser = process.env.GMAIL_SMTP_USER || '';
    this.gmailPassword = process.env.GMAIL_SMTP_APP_PASSWORD || '';
    this.gmailFromName = process.env.GMAIL_SMTP_FROM_NAME || 'The Covenant Church';
    this.gmailTransporter = null;

    // BulkSMS Nigeria for SMS
    this.bulksmsEnabled = false;
    this.bulksmsApiToken = process.env.BULKSMS_NIGERIA_API_TOKEN || '';
    this.bulksmsSenderName = process.env.BULKSMS_NIGERIA_SENDER_NAME || 'TCC';
    this.bulksmsDndEnabled = process.env.BULKSMS_NIGERIA_DND_ENABLED === 'true';

    this.initializeServices();
  }

  /**
   * Initialize communication services
   */
  initializeServices() {
    // Initialize Meta WhatsApp
    if (this.whatsappPhoneNumberId && this.whatsappAccessToken) {
      this.whatsappEnabled = true;
      logger.info('Meta WhatsApp Cloud API initialized');
    } else {
      logger.warn('Meta WhatsApp not configured');
    }

    // Initialize SendGrid
    if (this.sendgridApiKey && this.sendgridApiKey.startsWith('SG.')) {
      try {
        sgMail.setApiKey(this.sendgridApiKey);
        this.sendgridEnabled = true;
        logger.info('SendGrid email service initialized');
      } catch (error) {
        logger.error('Failed to initialize SendGrid', { error: error.message });
      }
    } else {
      logger.warn('SendGrid not configured or invalid API key');
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
        logger.info('Gmail SMTP service initialized');
      } catch (error) {
        logger.error('Failed to initialize Gmail SMTP', { error: error.message });
      }
    } else {
      logger.warn('Gmail SMTP not configured');
    }

    // Initialize BulkSMS Nigeria
    if (this.bulksmsApiToken) {
      this.bulksmsEnabled = true;
      logger.info('BulkSMS Nigeria service initialized');
    } else {
      logger.warn('BulkSMS Nigeria not configured');
    }
  }

  /**
   * Format phone number to E.164 format for WhatsApp/SMS
   * Handles Nigerian numbers (+234)
   */
  formatPhoneNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, replace with 234
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.substring(1);
    }
    
    // If doesn't start with 234, add it
    if (!cleaned.startsWith('234')) {
      cleaned = '234' + cleaned;
    }
    
    return '+' + cleaned;
  }

  /**
   * Send SMS via BulkSMS Nigeria
   */
  async sendSMS(to, message, options = {}) {
    try {
      const formattedPhone = this.formatPhoneNumber(to);
      logger.info('Sending SMS via BulkSMS Nigeria', { to: formattedPhone, message: message.substring(0, 50) });

      // Record in database
      const communication = await this.recordCommunication({
        recipientID: options.recipientID || '',
        recipientType: 'Individual',
        messageType: 'SMS',
        subject: '',
        message,
        sentBy: options.sentBy || '',
        cost: options.cost || 0,
        provider: 'BulkSMS Nigeria',
      });

      if (this.bulksmsEnabled) {
        try {
          // BulkSMS Nigeria API
          const response = await axios.post('https://www.bulksmsnigeria.com/api/v1/sms/create', {
            api_token: this.bulksmsApiToken,
            from: this.bulksmsSenderName,
            to: formattedPhone,
            body: message,
            dnd: this.bulksmsDndEnabled ? '2' : '1', // 2 = bypass DND, 1 = respect DND
          });

          if (response.data && response.data.status === 'success') {
            const cost = parseFloat(response.data.data.cost || 0);
            
            await this.updateCommunicationStatus(communication.communicationID, 'Sent', {
              sentAt: new Date().toISOString(),
              cost: cost,
            });

            logger.info('SMS sent successfully via BulkSMS Nigeria', { 
              messageId: response.data.data.message_id,
              cost: cost
            });

            return { 
              success: true, 
              messageId: response.data.data.message_id, 
              communication,
              cost: cost
            };
          } else {
            throw new Error(response.data.message || 'Failed to send SMS');
          }
        } catch (apiError) {
          const errorMessage = apiError.response?.data?.message || apiError.message;
          logger.error('BulkSMS Nigeria API error', { error: errorMessage });
          
          await this.updateCommunicationStatus(communication.communicationID, 'Failed', {
            failureReason: errorMessage,
          });

          return {
            success: false,
            message: errorMessage,
            communication,
          };
        }
      }

      // Service not configured
      logger.warn('SMS not sent - BulkSMS Nigeria not configured');
      await this.updateCommunicationStatus(communication.communicationID, 'Failed', {
        failureReason: 'BulkSMS Nigeria not configured',
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
   * Send WhatsApp message via Meta Cloud API
   */
  async sendWhatsApp(to, message, options = {}) {
    try {
      const formattedPhone = this.formatPhoneNumber(to);
      logger.info('Sending WhatsApp via Meta Cloud API', { to: formattedPhone, message: message.substring(0, 50) });

      // Record in database
      const communication = await this.recordCommunication({
        recipientID: options.recipientID || '',
        recipientType: 'Individual',
        messageType: 'WhatsApp',
        subject: '',
        message,
        sentBy: options.sentBy || '',
        cost: 0, // Free for utility conversations
        provider: 'Meta WhatsApp',
      });

      if (this.whatsappEnabled) {
        try {
          // Meta WhatsApp Cloud API v21.0
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
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.data && response.data.messages && response.data.messages[0].id) {
            await this.updateCommunicationStatus(communication.communicationID, 'Sent', {
              sentAt: new Date().toISOString(),
            });

            logger.info('WhatsApp sent successfully via Meta', { 
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
            failureReason: errorMessage,
          });

          return {
            success: false,
            message: errorMessage,
            communication,
          };
        }
      }

      // Service not configured
      logger.warn('WhatsApp not sent - Meta WhatsApp not configured');
      await this.updateCommunicationStatus(communication.communicationID, 'Failed', {
        failureReason: 'Meta WhatsApp not configured',
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
   * Send Email via SendGrid or Gmail SMTP
   */
  async sendEmail(to, subject, htmlContent, options = {}) {
    try {
      const provider = options.emailProvider || 'sendgrid'; // Default to SendGrid
      logger.info(`Sending Email via ${provider}`, { to, subject });

      // Record in database
      const communication = await this.recordCommunication({
        recipientID: options.recipientID || '',
        recipientType: 'Individual',
        messageType: 'Email',
        subject,
        message: htmlContent,
        sentBy: options.sentBy || '',
        cost: 0, // Free for both SendGrid and Gmail
        provider: provider === 'sendgrid' ? 'SendGrid' : 'Gmail SMTP',
      });

      if (provider === 'sendgrid' && this.sendgridEnabled) {
        try {
          const msg = {
            to: to,
            from: {
              email: this.sendgridFromEmail,
              name: this.sendgridFromName,
            },
            subject: subject,
            html: htmlContent,
          };

          // If using SendGrid template
          if (options.templateId) {
            msg.templateId = options.templateId;
            msg.dynamicTemplateData = options.templateData || {};
          }

          const response = await sgMail.send(msg);

          await this.updateCommunicationStatus(communication.communicationID, 'Sent', {
            sentAt: new Date().toISOString(),
          });

          logger.info('Email sent successfully via SendGrid', { 
            messageId: response[0].headers['x-message-id'] 
          });

          return { 
            success: true, 
            messageId: response[0].headers['x-message-id'], 
            communication 
          };
        } catch (apiError) {
          const errorMessage = apiError.response?.body?.errors?.[0]?.message || apiError.message;
          logger.error('SendGrid API error', { error: errorMessage });
          
          await this.updateCommunicationStatus(communication.communicationID, 'Failed', {
            failureReason: errorMessage,
          });

          return {
            success: false,
            message: errorMessage,
            communication,
          };
        }
      } else if (provider === 'gmail' && this.gmailEnabled) {
        try {
          const mailOptions = {
            from: `"${this.gmailFromName}" <${this.gmailUser}>`,
            to: to,
            subject: subject,
            html: htmlContent,
            ...(options.attachments && { attachments: options.attachments }),
          };

          const result = await this.gmailTransporter.sendMail(mailOptions);

          await this.updateCommunicationStatus(communication.communicationID, 'Sent', {
            sentAt: new Date().toISOString(),
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
            failureReason: smtpError.message,
          });

          return {
            success: false,
            message: smtpError.message,
            communication,
          };
        }
      }

      // Service not configured or invalid provider
      const errorMsg = provider === 'sendgrid' ? 'SendGrid not configured' : 'Gmail SMTP not configured';
      logger.warn(`Email not sent - ${errorMsg}`);
      await this.updateCommunicationStatus(communication.communicationID, 'Failed', {
        failureReason: errorMsg,
      });

      return {
        success: false,
        message: errorMsg,
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
        totalCost: 0,
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
              if (result.cost) {
                results.totalCost += result.cost;
              }
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
                options.subject || 'Message from The Covenant Church',
                message,
                {
                  recipientID: recipient.memberID,
                  sentBy: options.sentBy,
                  emailProvider: options.emailProvider || 'sendgrid',
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
        totalCost: results.totalCost,
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
        cost: data.cost || 0,
        provider: data.provider || '',
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
        'Cost',
        'Provider',
        'CreatedAt',
        'UpdatedAt',
      ];

      const rows = [
        headers,
        ...communications.map((c) =>
          headers.map((h) => {
            const key = h.charAt(0).toLowerCase() + h.slice(1);
            return c[key] !== undefined ? c[key] : '';
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
        'Cost',
        'Provider',
        'CreatedAt',
        'UpdatedAt',
      ];

      const rows = [
        headers,
        ...communications.map((c) =>
          headers.map((h) => {
            const key = h.charAt(0).toLowerCase() + h.slice(1);
            return c[key] !== undefined ? c[key] : '';
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
   * Get communications history with custom date range filtering
   */
  async getHistory(filters = {}) {
    try {
      const communications = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.COMMUNICATIONS
      );

      let filtered = [...communications];

      // Filter by date range
      if (filters.startDate || filters.endDate) {
        filtered = filtered.filter(comm => {
          const commDate = new Date(comm.createdAt);
          
          if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            if (commDate < startDate) return false;
          }
          
          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999); // End of day
            if (commDate > endDate) return false;
          }
          
          return true;
        });
      }

      // Filter by channel (messageType)
      if (filters.channel) {
        filtered = filtered.filter(comm => 
          comm.messageType.toLowerCase() === filters.channel.toLowerCase()
        );
      }

      // Filter by status
      if (filters.status) {
        filtered = filtered.filter(comm => 
          comm.status.toLowerCase() === filters.status.toLowerCase()
        );
      }

      // Sort by date (newest first)
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return filtered;
    } catch (error) {
      logger.error('Error getting communications history', { error: error.message });
      throw error;
    }
  }

  /**
   * Get cost analysis for admin reporting
   */
  async getCostAnalysis(startDate, endDate) {
    try {
      const communications = await this.getHistory({ startDate, endDate });

      const analysis = {
        totalCost: 0,
        totalMessages: communications.length,
        costByChannel: {
          sms: { count: 0, cost: 0 },
          whatsapp: { count: 0, cost: 0 },
          email: { count: 0, cost: 0 },
        },
        costByProvider: {},
        averageCostPerMessage: 0,
      };

      communications.forEach(comm => {
        const cost = parseFloat(comm.cost || 0);
        const channel = comm.messageType.toLowerCase();
        const provider = comm.provider || 'Unknown';

        analysis.totalCost += cost;

        if (analysis.costByChannel[channel]) {
          analysis.costByChannel[channel].count++;
          analysis.costByChannel[channel].cost += cost;
        }

        if (!analysis.costByProvider[provider]) {
          analysis.costByProvider[provider] = { count: 0, cost: 0 };
        }
        analysis.costByProvider[provider].count++;
        analysis.costByProvider[provider].cost += cost;
      });

      analysis.averageCostPerMessage = analysis.totalMessages > 0
        ? analysis.totalCost / analysis.totalMessages
        : 0;

      // Calculate cost per message by channel
      Object.keys(analysis.costByChannel).forEach(channel => {
        const channelData = analysis.costByChannel[channel];
        channelData.averageCost = channelData.count > 0
          ? channelData.cost / channelData.count
          : 0;
      });

      return analysis;
    } catch (error) {
      logger.error('Error getting cost analysis', { error: error.message });
      throw error;
    }
  }

  /**
   * Get peak sending times for admin optimization
   */
  async getPeakTimes(startDate, endDate) {
    try {
      const communications = await this.getHistory({ 
        startDate, 
        endDate,
        status: 'sent' // Only successful messages
      });

      const hourlyDistribution = Array(24).fill(0);
      const dayOfWeekDistribution = Array(7).fill(0);

      communications.forEach(comm => {
        if (comm.sentAt) {
          const sentDate = new Date(comm.sentAt);
          const hour = sentDate.getHours();
          const dayOfWeek = sentDate.getDay();

          hourlyDistribution[hour]++;
          dayOfWeekDistribution[dayOfWeek]++;
        }
      });

      // Find peak hour
      const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
      
      // Find peak day (0 = Sunday, 6 = Saturday)
      const peakDay = dayOfWeekDistribution.indexOf(Math.max(...dayOfWeekDistribution));
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      return {
        hourlyDistribution,
        dayOfWeekDistribution,
        peakHour: {
          hour: peakHour,
          label: `${peakHour}:00 - ${peakHour + 1}:00`,
          count: hourlyDistribution[peakHour],
        },
        peakDay: {
          day: peakDay,
          name: dayNames[peakDay],
          count: dayOfWeekDistribution[peakDay],
        },
        recommendation: `Best time to send: ${dayNames[peakDay]} at ${peakHour}:00`,
      };
    } catch (error) {
      logger.error('Error getting peak times', { error: error.message });
      throw error;
    }
  }

  /**
   * Get delivery rates by channel
   */
  async getDeliveryRates(startDate, endDate) {
    try {
      const communications = await this.getHistory({ startDate, endDate });

      const rates = {
        overall: { sent: 0, delivered: 0, failed: 0, pending: 0, total: 0 },
        byChannel: {
          sms: { sent: 0, delivered: 0, failed: 0, pending: 0, total: 0 },
          whatsapp: { sent: 0, delivered: 0, failed: 0, pending: 0, total: 0 },
          email: { sent: 0, delivered: 0, failed: 0, pending: 0, total: 0 },
        },
      };

      communications.forEach(comm => {
        const status = comm.status.toLowerCase();
        const channel = comm.messageType.toLowerCase();

        rates.overall.total++;
        if (rates.byChannel[channel]) {
          rates.byChannel[channel].total++;
        }

        if (status === 'sent' || status === 'delivered') {
          rates.overall.sent++;
          if (rates.byChannel[channel]) {
            rates.byChannel[channel].sent++;
          }
        }

        if (status === 'delivered') {
          rates.overall.delivered++;
          if (rates.byChannel[channel]) {
            rates.byChannel[channel].delivered++;
          }
        }

        if (status === 'failed') {
          rates.overall.failed++;
          if (rates.byChannel[channel]) {
            rates.byChannel[channel].failed++;
          }
        }

        if (status === 'pending') {
          rates.overall.pending++;
          if (rates.byChannel[channel]) {
            rates.byChannel[channel].pending++;
          }
        }
      });

      // Calculate percentages
      const calculatePercentages = (data) => {
        if (data.total === 0) return { ...data, successRate: 0, failureRate: 0 };
        return {
          ...data,
          successRate: ((data.sent / data.total) * 100).toFixed(2),
          failureRate: ((data.failed / data.total) * 100).toFixed(2),
        };
      };

      rates.overall = calculatePercentages(rates.overall);
      Object.keys(rates.byChannel).forEach(channel => {
        rates.byChannel[channel] = calculatePercentages(rates.byChannel[channel]);
      });

      return rates;
    } catch (error) {
      logger.error('Error getting delivery rates', { error: error.message });
      throw error;
    }
  }

  /**
   * Get all communications (legacy method for backward compatibility)
   */
  async getAll() {
    return this.getHistory();
  }

  /**
   * Send templated message
   */
  async sendTemplatedMessage(templateName, recipient, data, messageType = 'email', emailProvider = 'gmail') {
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
        birthday: {
          subject: `Happy Birthday ${data.firstName}!`,
          message: `
            <h1>Happy Birthday ${data.firstName}! 🎉</h1>
            <p>The Covenant Church family wishes you a wonderful birthday filled with joy and blessings.</p>
            <p>May this year bring you closer to God and all your dreams come true!</p>
            <p>God bless you abundantly!</p>
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
          { 
            recipientID: recipient.memberID,
            emailProvider: emailProvider, // Use Gmail for automated birthday emails
          }
        );
      } else if (messageType.toLowerCase() === 'sms') {
        // Strip HTML and send as SMS
        const textMessage = template.message.replace(/<[^>]*>/g, '').trim();
        return await this.sendSMS(recipient.phone, textMessage, {
          recipientID: recipient.memberID,
        });
      } else if (messageType.toLowerCase() === 'whatsapp') {
        // Strip HTML and send as WhatsApp
        const textMessage = template.message.replace(/<[^>]*>/g, '').trim();
        return await this.sendWhatsApp(recipient.phone, textMessage, {
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
