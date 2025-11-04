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
    return ['email', 'role', 'department', 'status'];
  }

  getDefaultHeaders() {
    return [
      'StaffID',
      'MemberID',
      'Email',
      'PasswordHash',
      'Role',
      'Department',
      'Status',
      'LastLogin',
      'CreatedAt',
      'UpdatedAt',
    ];
  }

  getIdColumn() {
    return 'StaffID';
  }

  async prepareCreateData(data, user) {
    // Validate member exists
    const members = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.MEMBERS
    );
    const member = members.find((m) => m.memberID === data.memberID);
    if (!member) {
      throw new ApiError(404, 'Member not found');
    }

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
      memberID: data.memberID,
      email: data.email,
      passwordHash: data.passwordHash || '', // Should be hashed by auth service
      role: data.role || 'Staff',
      department: data.department || 'General',
      status: data.status || 'Active',
      lastLogin: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  applyFilters(data, filters) {
    let filteredData = data;

    if (filters.role) {
      filteredData = filteredData.filter(
        (item) => item.role?.toLowerCase() === filters.role.toLowerCase()
      );
    }

    if (filters.department) {
      filteredData = filteredData.filter(
        (item) =>
          item.department?.toLowerCase() === filters.department.toLowerCase()
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
    
    // Remove password hashes from response
    if (res.locals.responseData) {
      res.locals.responseData.data = res.locals.responseData.data.map((staff) => {
        const { passwordHash, ...staffWithoutPassword } = staff;
        return staffWithoutPassword;
      });
    }
  }

  /**
   * Override getById to exclude password hash
   */
  async getById(req, res) {
    await super.getById(req, res);
    
    // Remove password hash from response
    if (res.locals.responseData) {
      const { passwordHash, ...staffWithoutPassword } = res.locals.responseData;
      res.json(staffWithoutPassword);
    }
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
