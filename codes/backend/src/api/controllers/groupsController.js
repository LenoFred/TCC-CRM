/**
 * Groups Controller
 * Handles all group-related operations
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');

class GroupsController extends BaseController {
  constructor() {
    super(sheetsService, sheetsService.SHEETS.GROUPS, 'Groups');
  }

  getSearchFields() {
    return ['groupName', 'groupType', 'description', 'status'];
  }

  getDefaultHeaders() {
    return [
      'GroupID',
      'GroupName',
      'GroupType',
      'Description',
      'LeaderID',
      'MeetingSchedule',
      'MeetingLocation',
      'Capacity',
      'Status',
      'CreatedAt',
      'UpdatedAt',
    ];
  }

  getIdColumn() {
    return 'GroupID';
  }

  async prepareCreateData(data, user) {
    return {
      groupID: generateId('GRP'),
      groupName: data.groupName,
      groupType: data.groupType || 'General',
      description: data.description || '',
      leaderID: data.leaderID || '',
      meetingSchedule: data.meetingSchedule || '',
      meetingLocation: data.meetingLocation || '',
      capacity: data.capacity || '',
      status: data.status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  applyFilters(data, filters) {
    let filteredData = data;

    if (filters.type) {
      filteredData = filteredData.filter(
        (item) => item.groupType?.toLowerCase() === filters.type.toLowerCase()
      );
    }

    if (filters.status) {
      filteredData = filteredData.filter(
        (item) => item.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.leaderID) {
      filteredData = filteredData.filter(
        (item) => item.leaderID === filters.leaderID
      );
    }

    return filteredData;
  }

  /**
   * Get group with its members
   */
  async getGroupWithMembers(req, res) {
    const { id } = req.params;

    // Get group details
    const groupData = await sheetsService.getSheetObjects(this.sheetName);
    const group = groupData.find((g) => this.matchId(g, id));

    if (!group) {
      throw new ApiError(404, 'Group not found');
    }

    // Get group members
    const groupMembersData = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.GROUP_MEMBERS
    );
    const groupMembers = groupMembersData.filter(
      (gm) => gm.groupID === group.groupID
    );

    // Get member details
    const membersData = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.MEMBERS
    );
    const members = groupMembers.map((gm) => {
      const member = membersData.find((m) => m.memberID === gm.memberID);
      return {
        ...member,
        role: gm.role,
        joinedDate: gm.joinedDate,
      };
    });

    res.json({
      ...group,
      members,
      memberCount: members.length,
    });
  }

  /**
   * Get groups by leader
   */
  async getGroupsByLeader(req, res) {
    const { leaderID } = req.params;

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const groups = data.filter((g) => g.leaderID === leaderID);

    res.json({
      total: groups.length,
      groups,
    });
  }

  /**
   * Get group statistics
   */
  async getStats(req, res) {
    const groupsData = await sheetsService.getSheetObjects(this.sheetName);
    const groupMembersData = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.GROUP_MEMBERS
    );

    // Calculate stats
    const totalGroups = groupsData.length;
    const activeGroups = groupsData.filter(
      (g) => g.status?.toLowerCase() === 'active'
    ).length;

    // Group types distribution
    const typeDistribution = {};
    groupsData.forEach((group) => {
      const type = group.groupType || 'Unknown';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    // Member counts
    const groupMemberCounts = {};
    groupMembersData.forEach((gm) => {
      groupMemberCounts[gm.groupID] = (groupMemberCounts[gm.groupID] || 0) + 1;
    });

    const avgMembersPerGroup =
      totalGroups > 0
        ? Object.values(groupMemberCounts).reduce((a, b) => a + b, 0) /
          totalGroups
        : 0;

    res.json({
      totalGroups,
      activeGroups,
      inactiveGroups: totalGroups - activeGroups,
      typeDistribution,
      avgMembersPerGroup: Math.round(avgMembersPerGroup * 10) / 10,
      largestGroup: Math.max(...Object.values(groupMemberCounts), 0),
    });
  }
}

module.exports = new GroupsController();
