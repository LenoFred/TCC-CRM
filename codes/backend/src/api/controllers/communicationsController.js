/**
 * Communications Controller
 * Handles SMS, email, and WhatsApp communications
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');
const { logger } = require('../../utils/logger');

class CommunicationsController extends BaseController {
  constructor() {
    super(sheetsService, sheetsService.SHEETS.COMMUNICATIONS, 'Communications');
  }

  getSearchFields() {
    return ['messageType', 'status', 'subject'];
  }

  getDefaultHeaders() {
    return [
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
  }

  getIdColumn() {
    return 'CommunicationID';
  }

  /**
   * Create/send new communication (Override base create method)
   * SIMPLE & CLEAN: Extract contacts based on channel, send one by one
   */
  async create(req, res) {
    const { message, channel, memberIds, familyIds, groupIds, staffIds, manualPhoneNumbers, manualEmails, subject, emailProvider } = req.body;

    logger.info('=== COMMUNICATIONS CREATE START ===', {
      channel,
      memberIds,
      familyIds,
      groupIds,
      staffIds,
      manualPhones: manualPhoneNumbers,
      manualEmails,
      fullBody: req.body
    });

    // Validate required fields
    if (!message || message.trim() === '') {
      logger.error('Validation failed: message is required');
      throw new ApiError(400, 'Message content is required');
    }

    if (!channel || channel.trim() === '') {
      logger.error('Validation failed: channel is required');
      throw new ApiError(400, 'Communication channel is required');
    }

    const communicationService = require('../../services/communicationService');
    const normalizedChannel = channel?.toLowerCase();

    // Simple arrays to collect contacts
    const phoneNumbers = [];
    const emails = [];

    try {
      // STEP 1: Get all members we need (from memberIds, familyIds, groupIds)
      const allMembers = await sheetsService.getSheetObjects(sheetsService.SHEETS.MEMBERS);
      
      logger.info('=== MEMBERS FROM SHEETS ===', {
        totalMembers: allMembers.length,
        sampleMember: allMembers[0] ? {
          memberID: allMembers[0].memberID,
          phone: allMembers[0].phoneNumber,
          email: allMembers[0].email
        } : null
      });

      const selectedMembers = [];

      // A. Add members directly selected
      if (memberIds && memberIds.length > 0) {
        memberIds.forEach(memberId => {
          const member = allMembers.find(m => String(m.memberID) === String(memberId));
          if (member) {
            selectedMembers.push(member);
            logger.info('Found member by ID', { memberID: member.memberID, phone: member.phoneNumber, email: member.email });
          } else {
            logger.warn('Member not found', { memberId });
          }
        });
      }

      // B. Add family members
      if (familyIds && familyIds.length > 0) {
        familyIds.forEach(familyId => {
          const familyMembers = allMembers.filter(m => String(m.familyID) === String(familyId));
          selectedMembers.push(...familyMembers);
          logger.info('Found family members', { familyId, count: familyMembers.length });
        });
      }

      // C. Add group members
      if (groupIds && groupIds.length > 0) {
        const groups = await sheetsService.getSheetObjects(sheetsService.SHEETS.GROUPS);
        groupIds.forEach(groupId => {
          const group = groups.find(g => String(g.groupID) === String(groupId));
          if (group && group.members) {
            let groupMemberIds = [];
            try {
              groupMemberIds = typeof group.members === 'string' ? JSON.parse(group.members) : group.members;
            } catch (e) {
              logger.error('Failed to parse group members', { groupId, error: e.message });
            }
            groupMemberIds.forEach(memberInfo => {
              const memberId = memberInfo.memberID || memberInfo.id || memberInfo;
              const member = allMembers.find(m => String(m.memberID) === String(memberId));
              if (member) {
                selectedMembers.push(member);
              }
            });
          }
        });
      }

      // D. Add staff members
      if (staffIds && staffIds.length > 0) {
        const staffMembers = await sheetsService.getSheetObjects(sheetsService.SHEETS.STAFF);
        logger.info('=== STAFF FROM SHEETS ===', {
          totalStaff: staffMembers.length,
          sampleStaff: staffMembers[0] ? {
            staffID: staffMembers[0].staffID,
            fullName: staffMembers[0].fullName,
            phone: staffMembers[0].phoneNumber,
            email: staffMembers[0].email
          } : null
        });

        staffIds.forEach(staffId => {
          const staffMember = staffMembers.find(s => String(s.staffID) === String(staffId));
          if (staffMember) {
            // Create a member-like object for staff
            selectedMembers.push({
              memberID: staffMember.staffID,
              firstName: staffMember.fullName ? staffMember.fullName.split(' ')[0] : '',
              lastName: staffMember.fullName ? staffMember.fullName.split(' ').slice(1).join(' ') : '',
              phoneNumber: staffMember.phoneNumber,
              email: staffMember.email
            });
            logger.info('Found staff member by ID', { 
              staffID: staffMember.staffID, 
              fullName: staffMember.fullName,
              phone: staffMember.phoneNumber, 
              email: staffMember.email 
            });
          } else {
            logger.warn('Staff member not found', { staffId });
          }
        });
      }

      // STEP 2: Extract contacts based on channel
      if (normalizedChannel === 'sms' || normalizedChannel === 'whatsapp') {
        // For SMS/WhatsApp: Extract phone numbers
        selectedMembers.forEach(member => {
          // Use phoneNumber field (not "phone")
          const phone = member.phoneNumber || member.phone;
          if (phone) {
            phoneNumbers.push({
              contact: phone,
              name: `${member.firstName} ${member.lastName}`,
              memberId: member.memberID
            });
            logger.info('Extracted phone', { phone, name: `${member.firstName} ${member.lastName}` });
          } else {
            logger.warn('Member has no phone', { memberID: member.memberID, name: `${member.firstName} ${member.lastName}` });
          }
        });

        // Add manual phone numbers
        if (manualPhoneNumbers && manualPhoneNumbers.length > 0) {
          manualPhoneNumbers.forEach(phone => {
            if (phone) {
              phoneNumbers.push({ contact: phone, name: 'Manual Contact', memberId: null });
            }
          });
        }

      } else if (normalizedChannel === 'email') {
        // For Email: Extract email addresses
        selectedMembers.forEach(member => {
          if (member.email) {
            emails.push({
              contact: member.email,
              name: `${member.firstName} ${member.lastName}`,
              memberId: member.memberID
            });
            logger.info('Extracted email', { email: member.email, name: `${member.firstName} ${member.lastName}` });
          } else {
            logger.warn('Member has no email', { memberID: member.memberID, name: `${member.firstName} ${member.lastName}` });
          }
        });

        // Add manual emails
        if (manualEmails && manualEmails.length > 0) {
          manualEmails.forEach(email => {
            if (email) {
              emails.push({ contact: email, name: 'Manual Contact', memberId: null });
            }
          });
        }
      }

      // STEP 3: Remove duplicates
      const uniquePhones = [...new Map(phoneNumbers.map(item => [item.contact, item])).values()];
      const uniqueEmails = [...new Map(emails.map(item => [item.contact, item])).values()];

      const recipientsToSend = normalizedChannel === 'email' ? uniqueEmails : uniquePhones;

      logger.info('=== RECIPIENTS TO SEND ===', {
        channel: normalizedChannel,
        total: recipientsToSend.length,
        recipients: recipientsToSend.map(r => r.contact)
      });

      if (recipientsToSend.length === 0) {
        throw new ApiError(400, `No valid ${normalizedChannel === 'email' ? 'email addresses' : 'phone numbers'} found for selected recipients`);
      }

      // STEP 4: Send messages IN PARALLEL (bulk sending for better performance)
      const results = { success: [], failed: [], total: recipientsToSend.length };

      // Create array of promises for parallel execution
      const sendPromises = recipientsToSend.map(async (recipient) => {
        try {
          logger.info(`Sending ${normalizedChannel} to ${recipient.contact}...`);

          if (normalizedChannel === 'sms') {
            await communicationService.sendSMS(recipient.contact, message, {
              recipientID: recipient.memberId,
              sentBy: req.user?.memberID || 'System'
            });
          } else if (normalizedChannel === 'email') {
            await communicationService.sendEmail(
              recipient.contact,
              subject || 'Message from TCC-CRM',
              message,
              {
                recipientID: recipient.memberId,
                sentBy: req.user?.memberID || 'System',
                emailProvider: emailProvider || 'gmail'
              }
            );
          } else if (normalizedChannel === 'whatsapp') {
            await communicationService.sendWhatsApp(recipient.contact, message, {
              recipientID: recipient.memberId,
              sentBy: req.user?.memberID || 'System'
            });
          }

          logger.info(`✓ Sent to ${recipient.contact}`);
          return { success: true, recipient: recipient.contact, name: recipient.name };

        } catch (error) {
          logger.error(`✗ Failed to send to ${recipient.contact}`, { error: error.message });
          return { success: false, recipient: recipient.contact, name: recipient.name, error: error.message };
        }
      });

      // Wait for all messages to be sent in parallel
      const sendResults = await Promise.all(sendPromises);

      // Categorize results
      sendResults.forEach(result => {
        if (result.success) {
          results.success.push({ recipient: result.recipient, name: result.name });
        } else {
          results.failed.push({ recipient: result.recipient, name: result.name, error: result.error });
        }
      });

      logger.info('=== COMMUNICATIONS CREATE COMPLETE ===', {
        total: results.total,
        sent: results.success.length,
        failed: results.failed.length
      });

      res.status(201).json({
        success: true,
        message: `Messages sent via ${channel}`,
        channel: normalizedChannel,
        results: {
          total: results.total,
          sent: results.success.length,
          failed: results.failed.length,
          details: { success: results.success, failed: results.failed }
        }
      });

    } catch (error) {
      logger.error('Error in create communication', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async prepareCreateData(data, user) {
    // Validate recipient if provided
    if (data.recipientID) {
      const members = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.MEMBERS
      );
      const member = members.find((m) => m.memberID === data.recipientID);
      if (!member) {
        throw new ApiError(404, 'Recipient not found');
      }
    }

    return {
      communicationID: generateId('COM'),
      recipientID: data.recipientID || '',
      recipientType: data.recipientType || 'Individual',
      messageType: data.messageType || 'Email',
      subject: data.subject || '',
      message: data.message || '',
      status: data.status || 'Pending',
      sentBy: user?.memberID || data.sentBy || '',
      sentAt: data.sentAt || '',
      deliveredAt: data.deliveredAt || '',
      failureReason: data.failureReason || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  applyFilters(data, filters) {
    let filteredData = data;

    if (filters.recipientID) {
      filteredData = filteredData.filter(
        (item) => item.recipientID === filters.recipientID
      );
    }

    if (filters.recipientType) {
      filteredData = filteredData.filter(
        (item) =>
          item.recipientType?.toLowerCase() === filters.recipientType.toLowerCase()
      );
    }

    if (filters.messageType) {
      filteredData = filteredData.filter(
        (item) =>
          item.messageType?.toLowerCase() === filters.messageType.toLowerCase()
      );
    }

    if (filters.status) {
      filteredData = filteredData.filter(
        (item) => item.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.sentBy) {
      filteredData = filteredData.filter((item) => item.sentBy === filters.sentBy);
    }

    return filteredData;
  }

  /**
   * Get communications by recipient
   */
  async getByRecipient(req, res) {
    const { recipientID } = req.params;

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const communications = data.filter((c) => c.recipientID === recipientID);

    res.json({
      recipientID,
      total: communications.length,
      communications,
    });
  }

  /**
   * Send bulk message
   */
  async sendBulk(req, res) {
    const { recipients, messageType, subject, message } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new ApiError(400, 'Recipients array is required');
    }

    if (!messageType || !message) {
      throw new ApiError(400, 'Message type and message content are required');
    }

    // Create communication records for each recipient
    const communications = [];
    for (const recipientID of recipients) {
      const comm = {
        recipientID,
        recipientType: 'Individual',
        messageType,
        subject: subject || '',
        message,
        sentBy: req.user?.memberID || '',
      };

      const preparedData = await this.prepareCreateData(comm, req.user);
      communications.push(preparedData);
    }

    // Batch insert into sheet
    const data = await sheetsService.getSheetObjects(this.sheetName);
    const headers = this.getDefaultHeaders();
    
    for (const comm of communications) {
      const row = headers.map((header) => {
        const key = header.charAt(0).toLowerCase() + header.slice(1);
        return comm[key] || '';
      });
      data.push(comm);
    }

    await sheetsService.updateSheetData(this.sheetName, [
      headers,
      ...data.map((item) =>
        headers.map((h) => {
          const key = h.charAt(0).toLowerCase() + h.slice(1);
          return item[key] || '';
        })
      ),
    ]);

    res.json({
      message: `Bulk message queued for ${communications.length} recipients`,
      total: communications.length,
      communications,
    });
  }

  /**
   * Update communication status
   */
  async updateStatus(req, res) {
    const { id } = req.params;
    const { status, failureReason } = req.body;

    if (!status) {
      throw new ApiError(400, 'Status is required');
    }

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const communication = data.find((c) => this.matchId(c, id));

    if (!communication) {
      throw new ApiError(404, 'Communication not found');
    }

    const updated = {
      ...communication,
      status,
      failureReason: failureReason || communication.failureReason,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'Sent' && !communication.sentAt) {
      updated.sentAt = new Date().toISOString();
    }

    if (status === 'Delivered' && !communication.deliveredAt) {
      updated.deliveredAt = new Date().toISOString();
    }

    await this.updateInSheet(communication, updated, data, req.user);

    res.json({
      message: 'Communication status updated successfully',
      data: updated,
    });
  }

  /**
   * Get communications history with custom date range filtering
   */
  async getHistory(req, res) {
    const { startDate, endDate, channel, status } = req.query;
    
    const communicationService = require('../../services/communicationService');
    
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (channel) filters.channel = channel;
    if (status) filters.status = status;

    const history = await communicationService.getHistory(filters);

    res.json({
      success: true,
      count: history.length,
      filters: filters,
      data: history,
    });
  }

  /**
   * Get communications analytics (cost analysis, peak times, delivery rates)
   */
  async getAnalytics(req, res) {
    const { startDate, endDate } = req.query;
    
    const communicationService = require('../../services/communicationService');

    // Get all analytics data
    const [costAnalysis, peakTimes, deliveryRates] = await Promise.all([
      communicationService.getCostAnalysis(startDate, endDate),
      communicationService.getPeakTimes(startDate, endDate),
      communicationService.getDeliveryRates(startDate, endDate),
    ]);

    res.json({
      success: true,
      dateRange: { startDate, endDate },
      costAnalysis,
      peakTimes,
      deliveryRates,
    });
  }

  /**
   * Get communication statistics
   */
  async getStats(req, res) {
    const { startDate, endDate } = req.query;

    let data = await sheetsService.getSheetObjects(this.sheetName);

    // Apply date filters if provided
    if (startDate || endDate) {
      data = data.filter((c) => {
        const createdDate = c.createdAt.split('T')[0];
        if (startDate && createdDate < startDate) return false;
        if (endDate && createdDate > endDate) return false;
        return true;
      });
    }

    const totalCommunications = data.length;
    const pendingCommunications = data.filter(
      (c) => c.status?.toLowerCase() === 'pending'
    ).length;
    const sentCommunications = data.filter(
      (c) => c.status?.toLowerCase() === 'sent'
    ).length;
    // Delivered = sent (as per user: "sent" means delivered)
    const deliveredCommunications = sentCommunications;
    const failedCommunications = data.filter(
      (c) => c.status?.toLowerCase() === 'failed'
    ).length;

    // Debug logging
    logger.info('=== COMMUNICATIONS STATS DEBUG ===');
    logger.info(`Total rows in Communications sheet: ${totalCommunications}`);
    logger.info(`Pending: ${pendingCommunications}`);
    logger.info(`Sent: ${sentCommunications}`);
    logger.info(`Failed: ${failedCommunications}`);
    logger.info('Status values found:', data.map(c => c.status).filter((v, i, a) => a.indexOf(v) === i));

    // Message type distribution
    const typeDistribution = {};
    data.forEach((c) => {
      const type = c.messageType || 'Unknown';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    // Recipient type distribution
    const recipientTypeDistribution = {};
    data.forEach((c) => {
      const type = c.recipientType || 'Unknown';
      recipientTypeDistribution[type] = (recipientTypeDistribution[type] || 0) + 1;
    });

    res.json({
      dateRange: { startDate, endDate },
      totalCommunications,
      pendingCommunications,
      sentCommunications,
      deliveredCommunications,
      failedCommunications,
      successRate:
        totalCommunications > 0
          ? Math.round((sentCommunications / totalCommunications) * 100)
          : 0,
      typeDistribution,
      recipientTypeDistribution,
    });
  }
}

module.exports = new CommunicationsController();
