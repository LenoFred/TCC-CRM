/**
 * Staff Controller
 * Handles staff/admin user operations
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');
const bcrypt = require('bcryptjs');
const authService = require('../../services/authService');

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
      'Role',
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
      throw new ApiError('Email already in use', 400);
    }

    // Check if username already exists (if provided)
    if (data.username) {
      const detailsData = await sheetsService.getSheetObjects(sheetsService.SHEETS.DETAILS);
      const existingUsername = detailsData.find(
        (d) => d.username?.toLowerCase() === data.username?.toLowerCase()
      );
      if (existingUsername) {
        throw new ApiError('Username already in use', 400);
      }
    }

    // Validate that username, password, and permissions are provided for new staff
    if (!data.username || !data.password) {
      throw new ApiError('Username and password are required', 400);
    }

    if (!data.permissions || !Array.isArray(data.permissions) || data.permissions.length === 0) {
      throw new ApiError('At least one permission is required', 400);
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
      // Store credentials and permissions temporarily for processing after staff creation
      _username: data.username,
      _password: data.password,
      _permissions: data.permissions,
      _groupPermissions: data.groupPermissions || [], // Group IDs array
      _userRole: data.userRole || 'Staff',
    };
  }

  /**
   * Override create to handle credentials and permissions
   */
  async create(req, res) {
    try {
      const createData = await this.prepareCreateData(req.body, req.user);
      
      // Extract credentials and permissions
      const username = createData._username;
      const password = createData._password;
      const permissions = createData._permissions;
      const groupPermissions = createData._groupPermissions || [];
      const staffID = createData.staffID;
      const userRole = createData._userRole;

      // Remove temporary fields before creating staff record
      delete createData._username;
      delete createData._password;
      delete createData._permissions;
      delete createData._groupPermissions;
      delete createData._userRole;

      // Add role to the staff record
      createData.role = userRole;

      // 1. Create staff record in Staff sheet
      const headers = this.getDefaultHeaders();
      const row = headers.map(header => {
        const camelKey = header.charAt(0).toLowerCase() + header.slice(1);
        return createData[camelKey] !== undefined 
          ? String(createData[camelKey])
          : '';
      });

      await sheetsService.appendSheetData(this.sheetName, [row]);

      // 2. Create credentials in Details sheet
      const hashedPassword = await bcrypt.hash(password, 10);
      const detailID = generateId('DETAIL');
      const detailsRow = [
        detailID,
        staffID,
        username,
        hashedPassword,
        new Date().toISOString(),
        new Date().toISOString(),
      ];
      await sheetsService.appendSheetData(sheetsService.SHEETS.DETAILS, [detailsRow]);

      // 3. Create permissions in StaffPermissions sheet (regular permissions + group permissions)
      const permissionRows = permissions.map((permissionKey) => [
        generateId('PRM'),
        staffID,
        permissionKey,
        'TRUE', // HasAccess
      ]);
      
      // Add group permissions as separate rows
      const groupPermissionRows = groupPermissions.map((groupId) => [
        generateId('PRM'),
        staffID,
        groupId, // PermissionKey is the groupID
        'TRUE', // HasAccess
      ]);
      
      const allPermissionRows = [...permissionRows, ...groupPermissionRows];
      if (allPermissionRows.length > 0) {
        await sheetsService.appendSheetData(sheetsService.SHEETS.STAFF_PERMISSIONS, allPermissionRows);
      }

      console.log(`✅ Staff created successfully: ${staffID} with ${permissions.length} permissions and ${groupPermissions.length} group permissions`);

      res.status(201).json({
        success: true,
        message: `${createData.fullName} created successfully`,
        data: {
          ...createData,
          username,
          permissionsCount: permissions.length,
        },
      });
    } catch (error) {
      console.error('❌ Error creating staff:', error);
      throw error;
    }
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
      throw new ApiError('Valid status is required (Active, Inactive, Suspended)', 400);
    }

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const staff = data.find((s) => this.matchId(s, id));

    if (!staff) {
      throw new ApiError('Staff member not found', 404);
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
