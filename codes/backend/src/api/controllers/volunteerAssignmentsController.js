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
      'GroupID',
      'RoleID',
      'AssignmentStatus',
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

    // Validate group exists
    const groups = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.GROUPS
    );
    const group = groups.find((g) => g.groupID === data.groupID);
    if (!group) {
      throw new ApiError(404, 'Group/Event not found');
    }

    return {
      assignmentID: generateId('VAS'),
      memberID: data.memberID,
      groupID: data.groupID,
      roleID: data.roleID,
      assignmentStatus: data.assignmentStatus || data.status || 'Scheduled',
    };
  }

  async getAll(req, res) {
    const { page, limit, search, ...filters } = req.query;

    // Get all assignments
    let data = await this.sheetsService.getSheetObjects(this.sheetName);
    
    // Get related data for enrichment
    const members = await this.sheetsService.getSheetObjects(this.sheetsService.SHEETS.MEMBERS);
    const roles = await this.sheetsService.getSheetObjects(this.sheetsService.SHEETS.VOLUNTEER_ROLES);
    const groups = await this.sheetsService.getSheetObjects(this.sheetsService.SHEETS.GROUPS);
    
    // Enrich assignments with member, role, and group/event details
    const enrichedData = data.map(assignment => {
      const member = members.find(m => m.memberID === assignment.memberID);
      const role = roles.find(r => r.roleID === assignment.roleID);
      const group = groups.find(g => g.groupID === assignment.groupID);
      
      return {
        ...assignment,
        memberName: member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : null,
        roleName: role?.roleName || null,
        groupName: group?.groupName || null,
        groupType: group?.groupType || null,
      };
    });

    // Apply filters
    let filteredData = this.applyFilters(enrichedData, filters);

    res.json({
      success: true,
      data: filteredData,
      total: filteredData.length,
    });
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

    if (filters.groupID) {
      filteredData = filteredData.filter(
        (item) => item.groupID === filters.groupID
      );
    }

    if (filters.assignmentStatus || filters.status) {
      const status = filters.assignmentStatus || filters.status;
      filteredData = filteredData.filter(
        (item) => item.assignmentStatus?.toLowerCase() === status.toLowerCase()
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
