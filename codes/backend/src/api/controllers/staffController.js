/**
 * Staff Controller
 * Handles staff/admin user operations
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');

class StaffController extends BaseController {
  constructor() {
    super(sheetsService, sheetsService.SHEETS.STAFF, 'Staff');
  }

  getSearchFields() {
    return ['fullName', 'email', 'staffRole', 'jobTitle', 'status'];
  }

  getDefaultHeaders() {
    return [
      'StaffID',
      'JobTitle',
      'AppointmentDate',
      'FullName',
      'Email',
      'StaffRole',
      'Status',
      'PhoneNumber',
      'LastLogin',
      'UpdatedAt',
    ];
  }

  getIdColumn() {
    return 'StaffID';
  }

  async prepareCreateData(data, user) {
    // Check if email already exists
    const staff = await sheetsService.getSheetObjects(this.sheetName);
    const existingStaff = staff.find(
      (s) => s.email?.toLowerCase() === data.email?.toLowerCase()
    );
    if (existingStaff) {
      throw new ApiError(400, 'Email already in use');
    }

    return {
      staffID: generateId('STF'),
      jobTitle: data.jobTitle || data.role || 'Staff',
      appointmentDate: data.appointmentDate || new Date().toISOString().split('T')[0],
      fullName: data.name || data.fullName || '',
      email: data.email || '',
      staffRole: data.staffRole || data.role || 'Staff',
      status: data.status || 'Active',
      phoneNumber: data.phone || data.phoneNumber || '',
      lastLogin: '', // Will be populated when staff logs in
      updatedAt: new Date().toISOString(), // Track creation time with full timestamp
    };
  }

  applyFilters(data, filters) {
    let filteredData = data;

    if (filters.staffRole || filters.role) {
      const role = filters.staffRole || filters.role;
      filteredData = filteredData.filter(
        (item) => item.staffRole?.toLowerCase() === role.toLowerCase()
      );
    }

    if (filters.jobTitle) {
      filteredData = filteredData.filter(
        (item) =>
          item.jobTitle?.toLowerCase().includes(filters.jobTitle.toLowerCase())
      );
    }

    if (filters.status) {
      filteredData = filteredData.filter(
        (item) => item.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    return filteredData;
  }

  /**
   * Override getAll to exclude password hash from response
   */
  async getAll(req, res) {
    await super.getAll(req, res);
  }

  /**
   * Override getById - no special handling needed
   */
  async getById(req, res) {
    await super.getById(req, res);
  }

  /**
   * Override update to automatically set UpdatedAt timestamp
   */
  async update(req, res) {
    const { id } = req.params;
    const updateData = req.body;

    console.log('📝 Update request received:', {
      id,
      updateData,
      role: updateData.role,
      staffRole: updateData.staffRole
    });

    // Transform field names from frontend to backend format
    if (updateData.name) updateData.fullName = updateData.name;
    if (updateData.role) updateData.staffRole = updateData.role;
    if (updateData.phone) updateData.phoneNumber = updateData.phone;

    console.log('📝 After transformation:', {
      fullName: updateData.fullName,
      staffRole: updateData.staffRole,
      phoneNumber: updateData.phoneNumber
    });

    // Automatically set UpdatedAt to current timestamp
    updateData.updatedAt = new Date().toISOString();

    // Call parent update method
    req.body = updateData;
    await super.update(req, res);
  }

  /**
   * Get staff by role
   */
  async getByRole(req, res) {
    const { role } = req.params;

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const staff = data
      .filter((s) => s.role?.toLowerCase() === role.toLowerCase())
      .map(({ passwordHash, ...staffWithoutPassword }) => staffWithoutPassword);

    res.json({
      role,
      total: staff.length,
      staff,
    });
  }

  /**
   * Get staff by department
   */
  async getByDepartment(req, res) {
    const { department } = req.params;

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const staff = data
      .filter((s) => s.department?.toLowerCase() === department.toLowerCase())
      .map(({ passwordHash, ...staffWithoutPassword }) => staffWithoutPassword);

    res.json({
      department,
      total: staff.length,
      staff,
    });
  }

  /**
   * Update staff status
   */
  async updateStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Active', 'Inactive', 'Suspended'].includes(status)) {
      throw new ApiError(400, 'Valid status is required (Active, Inactive, Suspended)');
    }

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const staff = data.find((s) => this.matchId(s, id));

    if (!staff) {
      throw new ApiError(404, 'Staff member not found');
    }

    const updated = {
      ...staff,
      status,
      updatedAt: new Date().toISOString(),
    };

    await this.updateInSheet(staff, updated, data, req.user);

    const { passwordHash, ...staffWithoutPassword } = updated;
    res.json({
      message: 'Staff status updated successfully',
      data: staffWithoutPassword,
    });
  }

  /**
   * Get staff statistics
   */
  async getStats(req, res) {
    const data = await sheetsService.getSheetObjects(this.sheetName);

    const totalStaff = data.length;
    const activeStaff = data.filter(
      (s) => s.status?.toLowerCase() === 'active'
    ).length;
    const inactiveStaff = data.filter(
      (s) => s.status?.toLowerCase() === 'inactive'
    ).length;

    // Role distribution
    const roleDistribution = {};
    data.forEach((s) => {
      const role = s.role || 'Unknown';
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
    });

    // Department distribution
    const departmentDistribution = {};
    data.forEach((s) => {
      const dept = s.department || 'Unknown';
      departmentDistribution[dept] = (departmentDistribution[dept] || 0) + 1;
    });

    res.json({
      totalStaff,
      activeStaff,
      inactiveStaff,
      roleDistribution,
      departmentDistribution,
    });
  }
}

module.exports = new StaffController();
