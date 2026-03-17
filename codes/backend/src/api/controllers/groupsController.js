/**
 * Groups Controller
 * Handles all group-related operations
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');
const { filterByGroupPermissions } = require('../../middlewares/groupPermissions');

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
        'AsstLeaderID',
        'PastorID',
        'Status',
        'MeetingLocation',
        'Description',
        'classType',
        'sessionNumber',
      ];
  }

  getIdColumn() {
    return 'GroupID';
  }

  async prepareCreateData(data, user) {
    // Validate AsstLeaderID and PastorID
    let asstLeaderID = data.asstLeaderID ?? data.AsstLeaderID ?? '';
    let pastorID = data.pastorID ?? data.PastorID ?? '';
    // Check if referenced MemberIDs exist
    const members = await sheetsService.getSheetObjects(sheetsService.SHEETS.MEMBERS);
    if (asstLeaderID && !members.find(m => m.memberID === asstLeaderID)) {
      throw new ApiError(400, `Assistant Leader ID ${asstLeaderID} does not exist in Members sheet.`);
    }
    if (pastorID && !members.find(m => m.memberID === pastorID)) {
      throw new ApiError(400, `Pastor ID ${pastorID} does not exist in Members sheet.`);
    }
    return {
      groupID: generateId('GROUP'),
      groupName: data.groupName,
      groupType: data.groupType || 'General',
      leaderMemberID: data.leaderMemberID || '',
      AsstLeaderID: asstLeaderID,
      PastorID: pastorID,
      status: data.status || 'Active',
      meetingLocation: data.meetingLocation || '',
      description: data.description || '',
      classType: (data.classType ?? data.ClassType ?? '') || '',
      sessionNumber: (data.sessionNumber ?? data.SessionNumber) !== undefined ? (data.sessionNumber ?? data.SessionNumber) : '',
    };
  }

  async prepareUpdateData(data, user) {
    const updateData = {};
    if (data.groupName !== undefined) updateData.groupName = data.groupName;
    if (data.groupType !== undefined) updateData.groupType = data.groupType;
    if (data.leaderMemberID !== undefined) updateData.leaderMemberID = data.leaderMemberID;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.meetingLocation !== undefined) updateData.meetingLocation = data.meetingLocation;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.classType !== undefined || data.ClassType !== undefined) {
      updateData.classType = data.classType ?? data.ClassType;
    }
    if (data.sessionNumber !== undefined || data.SessionNumber !== undefined) {
      updateData.sessionNumber = data.sessionNumber ?? data.SessionNumber;
    }
    // AsstLeaderID and PastorID
    if (data.AsstLeaderID !== undefined || data.asstLeaderID !== undefined) {
      const members = await sheetsService.getSheetObjects(sheetsService.SHEETS.MEMBERS);
      const asstLeader = data.AsstLeaderID ?? data.asstLeaderID;
      if (asstLeader && !members.find(m => m.memberID === asstLeader)) {
        throw new ApiError(400, `Assistant Leader ID ${asstLeader} does not exist in Members sheet.`);
      }
      updateData.AsstLeaderID = asstLeader || '';
    }
    if (data.PastorID !== undefined || data.pastorID !== undefined) {
      const members = await sheetsService.getSheetObjects(sheetsService.SHEETS.MEMBERS);
      const pastor = data.PastorID ?? data.pastorID;
      if (pastor && !members.find(m => m.memberID === pastor)) {
        throw new ApiError(400, `Pastor ID ${pastor} does not exist in Members sheet.`);
      }
      updateData.PastorID = pastor || '';
    }
    updateData.updatedAt = new Date().toISOString();
    return updateData;
  }

  /**
   * Override create to block creation if staff has group restrictions
   */
  async create(req, res) {
    // Check if staff is admin
    const isAdmin = req.user?.role?.toLowerCase() === 'admin';

    // Check if staff has group restrictions
    const groupPermissions = req.user?.groupPermissions;
    const hasGroupRestrictions = Array.isArray(groupPermissions) && groupPermissions.length > 0;

    // Block creation if staff has group restrictions (not admin)
    if (!isAdmin && hasGroupRestrictions) {
      throw new ApiError(403, 'You cannot create new groups because you are restricted to specific groups. Only admins or staff with no group restrictions can create new groups.');
    }

    // Call parent create method
    return super.create(req, res);
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
   * Override getAll to include member counts and filter by group permissions
   */
  async getAll(req, res) {
    const { page, limit, search, ...filters } = req.query;

    // Get groups data
    let groupsData = await sheetsService.getSheetObjects(this.sheetName);
    
    // Filter by group permissions (uses req.user.groupPermissions from token)
    groupsData = filterByGroupPermissions(groupsData, req, 'groupID');
    
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

    console.log(`\n🔍 DEBUG: Group ${group.groupID} has ${groupMembers.length} members in GroupMembers sheet`);
    console.log(`First few GroupMembers entries:`, JSON.stringify(groupMembers.slice(0, 3), null, 2));

    // Get member details
    const membersData = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.MEMBERS
    );

    console.log(`📊 Members sheet has ${membersData.length} total members`);
    console.log(`First few Members entries:`, JSON.stringify(membersData.slice(0, 3), null, 2));

    const members = groupMembers.map((gm) => {
      console.log(`  Looking for memberID: "${gm.memberID}" (type: ${typeof gm.memberID})`);

      // Find member with case-insensitive and type-safe comparison
      const member = membersData.find((m) => {
        const gmId = String(gm.memberID).toLowerCase().trim();
        const mId = String(m.memberID).toLowerCase().trim();
        const match = gmId === mId;
        if (match) console.log(`    ✅ FOUND: ${m.firstName} ${m.lastName}`);
        return match;
      });

      if (!member) {
        console.log(`    ❌ NOT FOUND in Members sheet`);
      }

      // IMPORTANT: Preserve memberID from GroupMembers even if member not found
      return {
        memberID: gm.memberID,  // Always keep the ID from GroupMembers
        firstName: member?.firstName || '',
        lastName: member?.lastName || '',
        phoneNumber: member?.phoneNumber || '',
        email: member?.email || '',
        status: member?.status || '',
        ...member,  // Spread member for any other fields
        role: gm.role,
        joinedDate: gm.joinedDate,
      };
    });

    console.log(`✅ Returning ${members.length} members\n`);

    // Get leader details separately (in case leader is not in GroupMembers yet)
    let leaderDetails = null;
    if (group.leaderMemberID) {
      const leader = membersData.find((m) =>
        String(m.memberID).toLowerCase().trim() === String(group.leaderMemberID).toLowerCase().trim()
      );
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

    const resolveMemberDetails = (memberID) => {
      if (!memberID) return null;
      const member = membersData.find((m) =>
        String(m.memberID).toLowerCase().trim() === String(memberID).toLowerCase().trim()
      );
      if (!member) return null;
      return {
        memberID: member.memberID,
        firstName: member.firstName,
        lastName: member.lastName,
        phoneNumber: member.phoneNumber,
        email: member.email,
      };
    };

    const assistantLeaderDetails = resolveMemberDetails(group.AsstLeaderID || group.assistantLeaderID || group.assistantLeader);
    const pastorDetails = resolveMemberDetails(group.PastorID || group.pastorID || group.pastor);

    res.json({
      success: true,
      data: {
        ...group,
        members,
        memberCount: members.length,
        leaderDetails,
        assistantLeaderDetails,
        pastorDetails,
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
