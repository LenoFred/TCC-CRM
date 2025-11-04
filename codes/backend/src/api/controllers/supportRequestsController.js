/**
 * SupportRequests Controller
 * Handles pastoral care and support request operations
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');

class SupportRequestsController extends BaseController {
  constructor() {
    super(sheetsService, sheetsService.SHEETS.SUPPORT_REQUESTS, 'SupportRequests');
  }

  getSearchFields() {
    return ['requestType', 'priority', 'status', 'category'];
  }

  getDefaultHeaders() {
    return [
      'RequestID',
      'MemberID',
      'RequestType',
      'Category',
      'Priority',
      'Description',
      'Status',
      'AssignedTo',
      'ResolvedBy',
      'RequestDate',
      'ResolvedDate',
      'Notes',
      'CreatedAt',
      'UpdatedAt',
    ];
  }

  getIdColumn() {
    return 'RequestID';
  }

  async prepareCreateData(data, user) {
    // Validate member exists
    if (data.memberID) {
      const members = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.MEMBERS
      );
      const member = members.find((m) => m.memberID === data.memberID);
      if (!member) {
        throw new ApiError(404, 'Member not found');
      }
    }

    return {
      requestID: generateId('SUP'),
      memberID: data.memberID || '',
      requestType: data.requestType || 'General',
      category: data.category || 'Pastoral Care',
      priority: data.priority || 'Medium',
      description: data.description || '',
      status: data.status || 'Open',
      assignedTo: data.assignedTo || '',
      resolvedBy: data.resolvedBy || '',
      requestDate: data.requestDate || new Date().toISOString().split('T')[0],
      resolvedDate: data.resolvedDate || '',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  applyFilters(data, filters) {
    let filteredData = data;

    if (filters.memberID) {
      filteredData = filteredData.filter(
        (item) => item.memberID === filters.memberID
      );
    }

    if (filters.type) {
      filteredData = filteredData.filter(
        (item) => item.requestType?.toLowerCase() === filters.type.toLowerCase()
      );
    }

    if (filters.category) {
      filteredData = filteredData.filter(
        (item) => item.category?.toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (filters.priority) {
      filteredData = filteredData.filter(
        (item) => item.priority?.toLowerCase() === filters.priority.toLowerCase()
      );
    }

    if (filters.status) {
      filteredData = filteredData.filter(
        (item) => item.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.assignedTo) {
      filteredData = filteredData.filter(
        (item) => item.assignedTo === filters.assignedTo
      );
    }

    return filteredData;
  }

  /**
   * Get requests by member
   */
  async getByMember(req, res) {
    const { memberID } = req.params;

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const requests = data.filter((r) => r.memberID === memberID);

    res.json({
      memberID,
      total: requests.length,
      requests,
    });
  }

  /**
   * Get requests assigned to staff
   */
  async getAssignedTo(req, res) {
    const { staffID } = req.params;

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const requests = data.filter((r) => r.assignedTo === staffID);

    res.json({
      staffID,
      total: requests.length,
      requests,
    });
  }

  /**
   * Assign request to staff
   */
  async assign(req, res) {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo) {
      throw new ApiError(400, 'Staff ID is required');
    }

    // Validate staff exists
    const staff = await sheetsService.getSheetObjects(sheetsService.SHEETS.STAFF);
    const staffMember = staff.find((s) => s.staffID === assignedTo);
    if (!staffMember) {
      throw new ApiError(404, 'Staff member not found');
    }

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const request = data.find((r) => this.matchId(r, id));

    if (!request) {
      throw new ApiError(404, 'Support request not found');
    }

    const updated = {
      ...request,
      assignedTo,
      status: 'In Progress',
      updatedAt: new Date().toISOString(),
    };

    await this.updateInSheet(request, updated, data, req.user);

    res.json({
      message: 'Request assigned successfully',
      data: updated,
    });
  }

  /**
   * Resolve request
   */
  async resolve(req, res) {
    const { id } = req.params;
    const { notes } = req.body;

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const request = data.find((r) => this.matchId(r, id));

    if (!request) {
      throw new ApiError(404, 'Support request not found');
    }

    if (request.status?.toLowerCase() === 'resolved') {
      throw new ApiError(400, 'Request already resolved');
    }

    const updated = {
      ...request,
      status: 'Resolved',
      resolvedBy: req.user?.memberID || '',
      resolvedDate: new Date().toISOString().split('T')[0],
      notes: notes || request.notes,
      updatedAt: new Date().toISOString(),
    };

    await this.updateInSheet(request, updated, data, req.user);

    res.json({
      message: 'Request resolved successfully',
      data: updated,
    });
  }

  /**
   * Get support request statistics
   */
  async getStats(req, res) {
    const data = await sheetsService.getSheetObjects(this.sheetName);

    const totalRequests = data.length;
    const openRequests = data.filter(
      (r) => r.status?.toLowerCase() === 'open'
    ).length;
    const inProgressRequests = data.filter(
      (r) => r.status?.toLowerCase() === 'in progress'
    ).length;
    const resolvedRequests = data.filter(
      (r) => r.status?.toLowerCase() === 'resolved'
    ).length;

    // Priority distribution
    const priorityDistribution = {};
    data.forEach((r) => {
      const priority = r.priority || 'Unknown';
      priorityDistribution[priority] = (priorityDistribution[priority] || 0) + 1;
    });

    // Category distribution
    const categoryDistribution = {};
    data.forEach((r) => {
      const category = r.category || 'Unknown';
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    });

    // Type distribution
    const typeDistribution = {};
    data.forEach((r) => {
      const type = r.requestType || 'Unknown';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    res.json({
      totalRequests,
      openRequests,
      inProgressRequests,
      resolvedRequests,
      priorityDistribution,
      categoryDistribution,
      typeDistribution,
    });
  }
}

module.exports = new SupportRequestsController();
