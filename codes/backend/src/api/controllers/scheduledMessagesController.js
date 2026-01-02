/**
 * Scheduled Messages Controller
 * Handles scheduled and automated message configurations
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');

class ScheduledMessagesController extends BaseController {
  constructor() {
    super(sheetsService, 'ScheduledMessages', 'ScheduledMessage');
  }

  getSearchFields() {
    return ['title', 'recipientType', 'scheduleType', 'status', 'tags'];
  }

  getDefaultHeaders() {
    return [
      'ScheduleID',
      'Title',
      'RecipientType',
      'Recipients',
      'Message',
      'Channel',
      'EmailProvider',
      'Subject',
      'ScheduleType',
      'ScheduleDate',
      'ScheduleTime',
      'Frequency',
      'Status',
      'GroupIDs',
      'Tags',
      'CreatedBy',
      'CreatedByName',
      'LastSent',
      'NextRun',
      'CreatedAt',
      'UpdatedAt',
    ];
  }

  getIdColumn() {
    return 'ScheduleID';
  }

  async prepareCreateData(data, user) {
    return {
      scheduleID: generateId('SCHEDULED_MESSAGE'),
      title: data.title || '',
      recipientType: data.recipientType || '',
      recipients: JSON.stringify(data.recipients || {}),
      message: data.message || '',
      channel: data.channel || '',
      emailProvider: data.emailProvider || '',
      subject: data.subject || '',
      scheduleType: data.scheduleType || 'once', // 'once', 'recurring', 'automated'
      scheduleDate: data.scheduleDate || '',
      scheduleTime: data.scheduleTime || '',
      frequency: data.frequency || '', // 'daily', 'weekly', 'monthly', 'yearly'
      status: data.status || 'pending', // 'pending', 'active', 'sent', 'cancelled', 'failed'
      groupIDs: data.groupIDs || '',
      tags: data.tags || '',
      createdBy: user?.id || '',
      createdByName: user?.name || 'System',
      lastSent: '',
      nextRun: data.scheduleDate && data.scheduleTime 
        ? `${data.scheduleDate}T${data.scheduleTime}:00`
        : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async prepareUpdateData(data, user) {
    const updateData = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.recipientType !== undefined) updateData.recipientType = data.recipientType;
    if (data.recipients !== undefined) updateData.recipients = JSON.stringify(data.recipients);
    if (data.message !== undefined) updateData.message = data.message;
    if (data.channel !== undefined) updateData.channel = data.channel;
    if (data.emailProvider !== undefined) updateData.emailProvider = data.emailProvider;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.scheduleType !== undefined) updateData.scheduleType = data.scheduleType;
    if (data.scheduleDate !== undefined) updateData.scheduleDate = data.scheduleDate;
    if (data.scheduleTime !== undefined) updateData.scheduleTime = data.scheduleTime;
    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.groupIDs !== undefined) updateData.groupIDs = data.groupIDs;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.lastSent !== undefined) updateData.lastSent = data.lastSent;
    if (data.nextRun !== undefined) updateData.nextRun = data.nextRun;
    
    updateData.updatedAt = new Date().toISOString();
    
    return updateData;
  }

  applyFilters(data, filters) {
    let filtered = data;

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(m => 
        m.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Filter by schedule type
    if (filters.scheduleType) {
      filtered = filtered.filter(m => 
        m.scheduleType?.toLowerCase() === filters.scheduleType.toLowerCase()
      );
    }

    // Filter by recipient type
    if (filters.recipientType) {
      filtered = filtered.filter(m => 
        m.recipientType?.toLowerCase() === filters.recipientType.toLowerCase()
      );
    }

    // Filter by channel
    if (filters.channel) {
      filtered = filtered.filter(m => 
        m.channel?.toLowerCase() === filters.channel.toLowerCase()
      );
    }

    // Filter by tags
    if (filters.tags) {
      filtered = filtered.filter(m => 
        m.tags?.toLowerCase().includes(filters.tags.toLowerCase())
      );
    }

    return filtered;
  }

  /**
   * Get active scheduled messages (pending or active status only)
   * Excludes sent, cancelled, and failed messages unless search is active
   */
  async getActiveSchedules(req, res) {
    const { page, limit, search, ...filters } = req.query;

    // Get all data
    let data = await this.sheetsService.getSheetObjects(this.sheetName);

    // Apply search if provided
    if (search) {
      const searchFields = this.getSearchFields();
      const searchLower = search.toLowerCase();
      data = data.filter(item =>
        searchFields.some(field =>
          String(item[field] || '').toLowerCase().includes(searchLower)
        )
      );
    } else {
      // If NO search, filter to show only active/pending/recurring
      data = data.filter(item => 
        ['pending', 'active'].includes(item.status?.toLowerCase())
      );
    }

    // Apply custom filters
    data = this.applyFilters(data, filters);

    // Sort by nextRun date (upcoming first)
    data.sort((a, b) => {
      const dateA = new Date(a.nextRun || a.scheduleDate || 0);
      const dateB = new Date(b.nextRun || b.scheduleDate || 0);
      return dateA - dateB;
    });

    // Apply pagination if requested
    if (page || limit) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      
      const paginated = data.slice(startIndex, endIndex);
      
      return res.json({
        success: true,
        data: paginated,
        total: data.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(data.length / limitNum),
      });
    }

    res.json({
      success: true,
      data,
      total: data.length,
    });
  }

  /**
   * Cancel a scheduled message
   */
  async cancel(req, res) {
    const { id } = req.params;

    const updates = {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };

    const idColumn = this.getIdColumn();
    const success = await this.sheetsService.updateRow(
      this.sheetName,
      idColumn,
      id,
      updates
    );

    if (!success) {
      throw new ApiError(`${this.entityName} not found`, 404);
    }

    res.json({
      success: true,
      message: `${this.entityName} cancelled successfully`,
    });
  }
}

module.exports = new ScheduledMessagesController();
