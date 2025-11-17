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

    // Check if member is already in this group (no status check since we're hard deleting)
    const groupMembers = await sheetsService.getSheetObjects(this.sheetName);
    const existingMembership = groupMembers.find(
      (gm) =>
        gm.groupID === data.groupID &&
        gm.memberID === data.memberID
    );

    if (existingMembership) {
      throw new ApiError(400, 'Member is already in this group');
    }

    return {
      groupMemberID: generateId('GROUP_MEMBER'),
      groupID: data.groupID,
      memberID: data.memberID,
      role: data.role || 'Member',
      joinedDate: data.joinedDate || new Date().toISOString().split('T')[0],
      status: data.status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Create multiple group members (batch create - more efficient)
   */
  async createMembers(req, res) {
    const membersData = req.body;

    console.log('➕ createMembers (batch) called with data:', membersData);

    if (!Array.isArray(membersData) || membersData.length === 0) {
      throw new ApiError(400, 'Request body must be a non-empty array of member data');
    }

    // Validate and prepare all members
    const preparedMembers = [];
    const errors = [];

    for (let i = 0; i < membersData.length; i++) {
      const data = membersData[i];
      
      try {
        // Validate required fields
        if (!data.groupID || !data.memberID) {
          throw new Error('groupID and memberID are required');
        }

        // Check if group exists
        const groups = await sheetsService.getSheetObjects(sheetsService.SHEETS.GROUPS);
        const group = groups.find((g) => g.groupID === data.groupID);
        if (!group) {
          throw new Error('Group not found');
        }

        // Check if member exists
        const members = await sheetsService.getSheetObjects(sheetsService.SHEETS.MEMBERS);
        const member = members.find((m) => m.memberID === data.memberID);
        if (!member) {
          throw new Error('Member not found');
        }

        // Prepare the member object
        preparedMembers.push({
          groupMemberID: generateId('GROUP_MEMBER'),
          groupID: data.groupID,
          memberID: data.memberID,
          role: data.role || 'Member',
          joinedDate: data.joinedDate || new Date().toISOString().split('T')[0],
          status: data.status || 'Active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        errors.push({ index: i, memberID: data.memberID, error: error.message });
      }
    }

    // If there were validation errors, return them
    if (errors.length > 0) {
      throw new ApiError(400, 'Some members failed validation', { errors });
    }

    // Check for duplicates within the batch and against existing members
    const groupMembers = await sheetsService.getSheetObjects(this.sheetName);
    const duplicates = [];

    preparedMembers.forEach((newMember, index) => {
      // Check against existing members
      const existingMembership = groupMembers.find(
        (gm) => gm.groupID === newMember.groupID && gm.memberID === newMember.memberID
      );
      
      if (existingMembership) {
        duplicates.push({ 
          index, 
          memberID: newMember.memberID, 
          groupID: newMember.groupID,
          error: 'Member already in this group' 
        });
      }

      // Check for duplicates within the batch itself
      const duplicateInBatch = preparedMembers.findIndex(
        (m, i) => i < index && m.groupID === newMember.groupID && m.memberID === newMember.memberID
      );
      
      if (duplicateInBatch !== -1) {
        duplicates.push({ 
          index, 
          memberID: newMember.memberID,
          groupID: newMember.groupID, 
          error: 'Duplicate within batch' 
        });
      }
    });

    if (duplicates.length > 0) {
      throw new ApiError(400, 'Some members are duplicates', { duplicates });
    }

    // Batch append all members in a single operation
    console.log(`📝 Batch creating ${preparedMembers.length} members`);
    const addedCount = await sheetsService.appendRows(this.sheetName, preparedMembers);

    console.log(`✅ Batch create completed: ${addedCount} members added`);

    res.status(201).json({
      success: true,
      message: `${addedCount} member(s) added to group successfully`,
      addedCount,
      data: preparedMembers,
    });
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

    console.log('🔍 getMembersByGroup called with groupID:', groupID);

    // Get group members
    const groupMembersData = await sheetsService.getSheetObjects(this.sheetName);
    console.log('📊 Total GroupMembers in sheet:', groupMembersData.length);
    console.log('📊 Sample GroupMember record:', groupMembersData[0]);
    
    // Filter by groupID only (no status filtering since we're hard deleting)
    const groupMembers = groupMembersData.filter(
      (gm) => gm.groupID === groupID
    );
    
    console.log('✅ Found ACTIVE group members for this group:', groupMembers.length);
    console.log('📋 GroupMembers:', groupMembers);

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
    
    console.log('✅ Returning members with details:', members.length);

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
   * Remove member from group (hard delete - completely removes row from sheet)
   */
  async removeMember(req, res) {
    const { id } = req.params;

    console.log('🗑️ removeMember called with ID:', id);

    // Get all group members
    const data = await sheetsService.getSheetObjects(this.sheetName);
    console.log('📊 Total GroupMembers in sheet:', data.length);
    
    // Find the membership by groupMemberID
    const membership = data.find((gm) => this.matchId(gm, id));
    console.log('🔍 Found membership:', membership);

    if (!membership) {
      console.log('❌ Membership not found for ID:', id);
      throw new ApiError(404, 'Group membership not found');
    }

    // Hard delete the row from the sheet using sheetsService.deleteRow
    console.log('📝 Deleting row from sheet for groupMemberID:', id);

    const deleted = await sheetsService.deleteRow(
      this.sheetName,
      this.getIdColumn(), // 'GroupMemberID'
      id
    );

    if (!deleted) {
      console.log('❌ Failed to delete row');
      throw new ApiError(500, 'Failed to remove member from group');
    }

    console.log('✅ Member removed successfully (row deleted from sheet)');

    res.json({
      success: true,
      message: 'Member removed from group successfully',
    });
  }

  /**
   * Remove multiple members from groups (batch delete - more efficient)
   */
  async removeMembers(req, res) {
    const { groupMemberIDs } = req.body;

    console.log('🗑️ removeMembers (batch) called with IDs:', groupMemberIDs);

    if (!Array.isArray(groupMemberIDs) || groupMemberIDs.length === 0) {
      throw new ApiError(400, 'groupMemberIDs must be a non-empty array');
    }

    // Batch delete using the new deleteRows method
    console.log(`📝 Batch deleting ${groupMemberIDs.length} members from sheet`);

    const deletedCount = await sheetsService.deleteRows(
      this.sheetName,
      this.getIdColumn(), // 'GroupMemberID'
      groupMemberIDs
    );

    console.log(`✅ Batch delete completed: ${deletedCount} members removed`);

    res.json({
      success: true,
      message: `${deletedCount} member(s) removed from group successfully`,
      deletedCount,
    });
  }
}

module.exports = new GroupMembersController();
