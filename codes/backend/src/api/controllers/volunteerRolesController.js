/**
 * VolunteerRoles Controller
 * Handles volunteer role management
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');

class VolunteerRolesController extends BaseController {
  constructor() {
    super(sheetsService, sheetsService.SHEETS.VOLUNTEER_ROLES, 'VolunteerRoles');
  }

  getSearchFields() {
    return ['roleName', 'department', 'description'];
  }

  getDefaultHeaders() {
    return [
      'RoleID',
      'RoleName',
      'Description',
    ];
  }

  getIdColumn() {
    return 'RoleID';
  }

  async prepareCreateData(data, user) {
    return {
      roleID: generateId('VOLUNTEER_ROLE'),
      roleName: data.roleName || data.name || '',
      description: data.description || '',
    };
  }

  applyFilters(data, filters) {
    let filteredData = data;

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
   * Get roles by department
   */
  async getByDepartment(req, res) {
    const { department } = req.params;

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const roles = data.filter(
      (r) => r.department?.toLowerCase() === department.toLowerCase()
    );

    res.json({
      department,
      total: roles.length,
      roles,
    });
  }

  /**
   * Get volunteer role statistics
   */
  async getStats(req, res) {
    const rolesData = await sheetsService.getSheetObjects(this.sheetName);
    const assignmentsData = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.VOLUNTEER_ASSIGNMENTS
    );

    const totalRoles = rolesData.length;
    const activeRoles = rolesData.filter(
      (r) => r.status?.toLowerCase() === 'active'
    ).length;

    // Department distribution
    const departmentDistribution = {};
    rolesData.forEach((role) => {
      const dept = role.department || 'Unknown';
      departmentDistribution[dept] = (departmentDistribution[dept] || 0) + 1;
    });

    // Roles with assignments
    const roleAssignmentCounts = {};
    assignmentsData.forEach((a) => {
      roleAssignmentCounts[a.roleID] = (roleAssignmentCounts[a.roleID] || 0) + 1;
    });

    const rolesWithAssignments = Object.keys(roleAssignmentCounts).length;
    const totalAssignments = assignmentsData.length;

    res.json({
      totalRoles,
      activeRoles,
      inactiveRoles: totalRoles - activeRoles,
      departmentDistribution,
      rolesWithAssignments,
      totalAssignments,
      avgAssignmentsPerRole:
        rolesWithAssignments > 0
          ? Math.round((totalAssignments / rolesWithAssignments) * 10) / 10
          : 0,
    });
  }
}

module.exports = new VolunteerRolesController();
