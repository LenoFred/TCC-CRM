/**
 * GroupMembers Controller
 * Handles group membership operations
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');

class GroupMembersController extends BaseController {
  constructor() {
    super(sheetsService, sheetsService.SHEETS.GROUP_MEMBERS, 'GroupMembers');
  }

  getSearchFields() {
    return ['role', 'status'];
  }

  getDefaultHeaders() {
    return [
      'GroupMemberID',
      'GroupID',
      'MemberID',
      'Role',
      'JoinedDate',
      'Status',
      'CreatedAt',
      'UpdatedAt',
    ];
  }

  getIdColumn() {
    return 'GroupMemberID';
  }

  async prepareCreateData(data, user) {
    // Validate that group and member exist
    const groups = await sheetsService.getSheetObjects(sheetsService.SHEETS.GROUPS);
    const group = groups.find((g) => g.groupID === data.groupID);
    if (!group) {
      throw new ApiError(404, 'Group not found');
    }

    const members = await sheetsService.getSheetObjects(sheetsService.SHEETS.MEMBERS);
    const member = members.find((m) => m.memberID === data.memberID);
    if (!member) {
      throw new ApiError(404, 'Member not found');
    }

    // Check if member is already in this group
    const groupMembers = await sheetsService.getSheetObjects(this.sheetName);
    const existingMembership = groupMembers.find(
      (gm) =>
        gm.groupID === data.groupID &&
        gm.memberID === data.memberID &&
        gm.status?.toLowerCase() === 'active'
    );

    if (existingMembership) {
      throw new ApiError(400, 'Member is already in this group');
    }

    return {
      groupMemberID: generateId('GRM'),
      groupID: data.groupID,
      memberID: data.memberID,
      role: data.role || 'Member',
      joinedDate: data.joinedDate || new Date().toISOString().split('T')[0],
      status: data.status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  applyFilters(data, filters) {
    let filteredData = data;

    if (filters.groupID) {
      filteredData = filteredData.filter((item) => item.groupID === filters.groupID);
    }

    if (filters.memberID) {
      filteredData = filteredData.filter((item) => item.memberID === filters.memberID);
    }

    if (filters.role) {
      filteredData = filteredData.filter(
        (item) => item.role?.toLowerCase() === filters.role.toLowerCase()
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
   * Get members of a specific group
   */
  async getMembersByGroup(req, res) {
    const { groupID } = req.params;

    // Get group members
    const groupMembersData = await sheetsService.getSheetObjects(this.sheetName);
    const groupMembers = groupMembersData.filter(
      (gm) => gm.groupID === groupID && gm.status?.toLowerCase() === 'active'
    );

    // Get member details
    const membersData = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.MEMBERS
    );

    const members = groupMembers.map((gm) => {
      const member = membersData.find((m) => m.memberID === gm.memberID);
      return {
        groupMemberID: gm.groupMemberID,
        role: gm.role,
        joinedDate: gm.joinedDate,
        status: gm.status,
        member: member || null,
      };
    });

    res.json({
      groupID,
      total: members.length,
      members,
    });
  }

  /**
   * Get groups of a specific member
   */
  async getGroupsByMember(req, res) {
    const { memberID } = req.params;

    // Get group memberships
    const groupMembersData = await sheetsService.getSheetObjects(this.sheetName);
    const memberGroups = groupMembersData.filter(
      (gm) => gm.memberID === memberID && (!gm.status || gm.status?.toLowerCase() === 'active')
    );

    // Get group details
    const groupsData = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.GROUPS
    );

    const groups = memberGroups.map((gm) => {
      const group = groupsData.find((g) => g.groupID === gm.groupID);
      return {
        groupMemberID: gm.groupMemberID,
        role: gm.role,
        joinedDate: gm.joinedDate,
        status: gm.status,
        group: group || null,
      };
    });

    res.json({
      memberID,
      total: groups.length,
      groups,
    });
  }

  /**
   * Remove member from group (soft delete)
   */
  async removeMember(req, res) {
    const { id } = req.params;

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const membership = data.find((gm) => this.matchId(gm, id));

    if (!membership) {
      throw new ApiError(404, 'Group membership not found');
    }

    // Update status to inactive
    const updatedMembership = {
      ...membership,
      status: 'Inactive',
      updatedAt: new Date().toISOString(),
    };

    await this.updateInSheet(membership, updatedMembership, data, req.user);

    res.json({
      message: 'Member removed from group successfully',
      data: updatedMembership,
    });
  }
}

module.exports = new GroupMembersController();
