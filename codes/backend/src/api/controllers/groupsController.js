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
      'LeaderMemberID',
      'Status',
      'MeetingLocation',
      'Description',
    ];
  }

  getIdColumn() {
    return 'GroupID';
  }

  async prepareCreateData(data, user) {
    return {
      groupID: generateId('GROUP'),
      groupName: data.groupName,
      groupType: data.groupType || 'General',
      leaderMemberID: data.leaderMemberID || '',
      status: data.status || 'Active',
      meetingLocation: data.meetingLocation || '',
      description: data.description || '',
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

    if (filters.leaderMemberID) {
      filteredData = filteredData.filter(
        (item) => item.leaderMemberID === filters.leaderMemberID
      );
    }

    return filteredData;
  }

  /**
   * Override getAll to include member counts
   */
  async getAll(req, res) {
    const { page, limit, search, ...filters } = req.query;

    // Get groups data
    let groupsData = await sheetsService.getSheetObjects(this.sheetName);
    
    // Get group members data
    const groupMembersData = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.GROUP_MEMBERS
    );

    // Create a map of group member counts (all members since we're hard deleting)
    const memberCounts = {};
    groupMembersData.forEach((gm) => {
      memberCounts[gm.groupID] = (memberCounts[gm.groupID] || 0) + 1;
    });

    // Add member count to each group
    groupsData = groupsData.map((group) => ({
      ...group,
      memberCount: memberCounts[group.groupID] || 0,
    }));

    // Apply search if provided
    if (search) {
      const searchFields = this.getSearchFields();
      const searchLower = search.toLowerCase();
      groupsData = groupsData.filter((group) =>
        searchFields.some((field) =>
          group[field]?.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply custom filters
    groupsData = this.applyFilters(groupsData, filters);

    // Apply pagination if requested
    if (page || limit) {
      const pageNum = parseInt(page) || 1;
      const pageSize = parseInt(limit) || 10;
      const startIndex = (pageNum - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      return res.json({
        success: true,
        data: groupsData.slice(startIndex, endIndex),
        total: groupsData.length,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(groupsData.length / pageSize),
      });
    }

    res.json({
      success: true,
      data: groupsData,
      total: groupsData.length,
    });
  }

  /**
   * Get group with its members
   */
  async getGroupWithMembers(req, res) {
    const { id } = req.params;

    // Validate ID
    if (!id || id === 'undefined' || id === 'null') {
      throw new ApiError(400, 'Invalid group ID provided');
    }

    // Get group details
    const groupData = await sheetsService.getSheetObjects(this.sheetName);
    const group = groupData.find((g) => this.matchId(g, id));

    if (!group) {
      throw new ApiError(404, 'Group not found');
    }

    // Get group members (all members since we're hard deleting)
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

    // Get leader details separately (in case leader is not in GroupMembers yet)
    let leaderDetails = null;
    if (group.leaderMemberID) {
      const leader = membersData.find((m) => m.memberID === group.leaderMemberID);
      if (leader) {
        leaderDetails = {
          memberID: leader.memberID,
          firstName: leader.firstName,
          lastName: leader.lastName,
          phoneNumber: leader.phoneNumber,
          email: leader.email,
        };
      }
    }

    res.json({
      success: true,
      data: {
        ...group,
        members,
        memberCount: members.length,
        leaderDetails,
      },
    });
  }

  /**
   * Get groups by leader
   */
  async getGroupsByLeader(req, res) {
    const { leaderMemberID } = req.params;

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const groups = data.filter((g) => g.leaderMemberID === leaderMemberID);

    res.json({
      success: true,
      total: groups.length,
      data: groups,
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
      success: true,
      data: {
        totalGroups,
        activeGroups,
        inactiveGroups: totalGroups - activeGroups,
        typeDistribution,
        avgMembersPerGroup: Math.round(avgMembersPerGroup * 10) / 10,
        largestGroup: Math.max(...Object.values(groupMemberCounts), 0),
      },
    });
  }
}

module.exports = new GroupsController();
