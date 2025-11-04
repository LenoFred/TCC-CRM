/**
 * VolunteerAssignments Controller
 * Handles volunteer assignment operations
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');

class VolunteerAssignmentsController extends BaseController {
  constructor() {
    super(
      sheetsService,
      sheetsService.SHEETS.VOLUNTEER_ASSIGNMENTS,
      'VolunteerAssignments'
    );
  }

  getSearchFields() {
    return ['status', 'frequency'];
  }

  getDefaultHeaders() {
    return [
      'AssignmentID',
      'MemberID',
      'RoleID',
      'StartDate',
      'EndDate',
      'Status',
      'Frequency',
      'Notes',
      'CreatedAt',
      'UpdatedAt',
    ];
  }

  getIdColumn() {
    return 'AssignmentID';
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

    // Validate role exists
    const roles = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.VOLUNTEER_ROLES
    );
    const role = roles.find((r) => r.roleID === data.roleID);
    if (!role) {
      throw new ApiError(404, 'Volunteer role not found');
    }

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;

    if (isNaN(startDate.getTime())) {
      throw new ApiError(400, 'Invalid start date');
    }

    if (endDate && isNaN(endDate.getTime())) {
      throw new ApiError(400, 'Invalid end date');
    }

    if (endDate && endDate < startDate) {
      throw new ApiError(400, 'End date cannot be before start date');
    }

    // Check for existing active assignment for same member and role
    const assignments = await sheetsService.getSheetObjects(this.sheetName);
    const existingAssignment = assignments.find(
      (a) =>
        a.memberID === data.memberID &&
        a.roleID === data.roleID &&
        a.status?.toLowerCase() === 'active'
    );

    if (existingAssignment) {
      throw new ApiError(
        400,
        'Member already has an active assignment for this role'
      );
    }

    return {
      assignmentID: generateId('VAS'),
      memberID: data.memberID,
      roleID: data.roleID,
      startDate: data.startDate,
      endDate: data.endDate || '',
      status: data.status || 'Active',
      frequency: data.frequency || 'Weekly',
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

    if (filters.roleID) {
      filteredData = filteredData.filter((item) => item.roleID === filters.roleID);
    }

    if (filters.status) {
      filteredData = filteredData.filter(
        (item) => item.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.frequency) {
      filteredData = filteredData.filter(
        (item) =>
          item.frequency?.toLowerCase() === filters.frequency.toLowerCase()
      );
    }

    return filteredData;
  }

  /**
   * Get assignments by member
   */
  async getByMember(req, res) {
    const { memberID } = req.params;

    const assignmentsData = await sheetsService.getSheetObjects(this.sheetName);
    const assignments = assignmentsData.filter((a) => a.memberID === memberID);

    // Get role details
    const rolesData = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.VOLUNTEER_ROLES
    );

    const assignmentsWithRoles = assignments.map((a) => {
      const role = rolesData.find((r) => r.roleID === a.roleID);
      return {
        ...a,
        role: role
          ? {
              roleID: role.roleID,
              roleName: role.roleName,
              department: role.department,
            }
          : null,
      };
    });

    res.json({
      memberID,
      total: assignmentsWithRoles.length,
      assignments: assignmentsWithRoles,
    });
  }

  /**
   * Get assignments by role
   */
  async getByRole(req, res) {
    const { roleID } = req.params;

    const assignmentsData = await sheetsService.getSheetObjects(this.sheetName);
    const assignments = assignmentsData.filter((a) => a.roleID === roleID);

    // Get member details
    const membersData = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.MEMBERS
    );

    const assignmentsWithMembers = assignments.map((a) => {
      const member = membersData.find((m) => m.memberID === a.memberID);
      return {
        ...a,
        member: member
          ? {
              memberID: member.memberID,
              firstName: member.firstName,
              lastName: member.lastName,
              email: member.email,
              phone: member.phone,
            }
          : null,
      };
    });

    res.json({
      roleID,
      total: assignmentsWithMembers.length,
      assignments: assignmentsWithMembers,
    });
  }

  /**
   * Complete/End an assignment
   */
  async complete(req, res) {
    const { id } = req.params;

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const assignment = data.find((a) => this.matchId(a, id));

    if (!assignment) {
      throw new ApiError(404, 'Assignment not found');
    }

    if (assignment.status?.toLowerCase() === 'completed') {
      throw new ApiError(400, 'Assignment already completed');
    }

    const updated = {
      ...assignment,
      status: 'Completed',
      endDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };

    await this.updateInSheet(assignment, updated, data, req.user);

    res.json({
      message: 'Assignment completed successfully',
      data: updated,
    });
  }

  /**
   * Get assignment statistics
   */
  async getStats(req, res) {
    const assignmentsData = await sheetsService.getSheetObjects(this.sheetName);

    const totalAssignments = assignmentsData.length;
    const activeAssignments = assignmentsData.filter(
      (a) => a.status?.toLowerCase() === 'active'
    ).length;
    const completedAssignments = assignmentsData.filter(
      (a) => a.status?.toLowerCase() === 'completed'
    ).length;

    // Frequency distribution
    const frequencyDistribution = {};
    assignmentsData.forEach((a) => {
      const freq = a.frequency || 'Unknown';
      frequencyDistribution[freq] = (frequencyDistribution[freq] || 0) + 1;
    });

    // Unique volunteers
    const uniqueVolunteers = new Set(
      assignmentsData.map((a) => a.memberID)
    ).size;

    // Unique roles assigned
    const uniqueRoles = new Set(assignmentsData.map((a) => a.roleID)).size;

    res.json({
      totalAssignments,
      activeAssignments,
      completedAssignments,
      uniqueVolunteers,
      uniqueRoles,
      frequencyDistribution,
    });
  }
}

module.exports = new VolunteerAssignmentsController();
