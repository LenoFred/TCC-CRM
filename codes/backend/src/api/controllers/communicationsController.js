/**
 * Communications Controller
 * Handles SMS, email, and WhatsApp communications
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');

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
    const deliveredCommunications = data.filter(
      (c) => c.status?.toLowerCase() === 'delivered'
    ).length;
    const failedCommunications = data.filter(
      (c) => c.status?.toLowerCase() === 'failed'
    ).length;

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
          ? Math.round((deliveredCommunications / totalCommunications) * 100)
          : 0,
      typeDistribution,
      recipientTypeDistribution,
    });
  }
}

module.exports = new CommunicationsController();
