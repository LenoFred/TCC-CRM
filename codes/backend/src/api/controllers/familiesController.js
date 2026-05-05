/**
 * Families Controller
 * Handles all family-related operations
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');
const { getStaffGroupPermissions } = require('../../middlewares/groupPermissions');

class FamiliesController extends BaseController {
  constructor() {
    super(sheetsService, sheetsService.SHEETS.FAMILIES, 'Family');
  }

  getSearchFields() {
    return ['familyName'];
  }

  getDefaultHeaders() {
    return ['FamilyID', 'FamilyName', 'CreatedDate', 'MemberCount', 'CreatedAt', 'UpdatedAt'];
  }

  getIdColumn() {
    return 'FamilyID';
  }

  async prepareCreateData(data, user) {
    // Validate that members array exists and has at least one member
    if (!data.members || data.members.length === 0) {
      throw new ApiError('At least one member must be added to the family', 400);
    }

    // Get all members to verify they exist and don't belong to another family
    const allMembers = await sheetsService.getMembers();
    
    for (const member of data.members) {
      const existingMember = allMembers.find(m => m.memberID === member.memberID);
      
      if (!existingMember) {
        throw new ApiError(`Member with ID ${member.memberID} does not exist`, 404);
      }
      
      if (existingMember.familyID && existingMember.familyID.trim() !== '') {
        throw new ApiError(
          `Member ${existingMember.firstName} ${existingMember.lastName} is already in another family`,
          400
        );
      }
    }

    return {
      familyID: generateId('FAMILY'),
      familyName: data.familyName || '',
      createdDate: new Date().toISOString().split('T')[0],
      memberCount: data.members.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async prepareUpdateData(data, user) {
    const updateData = {};
    
    if (data.familyName !== undefined) updateData.familyName = data.familyName;
    if (data.memberCount !== undefined) updateData.memberCount = data.memberCount;
    
    updateData.updatedAt = new Date().toISOString();
    
    return updateData;
  }

  /**
   * Override getAll to include family members and filter by group permissions
   */
  async getAll(req, res) {
    const { page, limit, search, includemembers } = req.query;

    // Get all families
    let families = await sheetsService.getFamilies();
    
    // Always get members to calculate member count
    const members = await sheetsService.getMembers();
    
    // Get group members for permission filtering
    const groupMembers = await sheetsService.getSheetObjects(sheetsService.SHEETS.GROUP_MEMBERS);
    const staffGroupPermissions = getStaffGroupPermissions(req);
    
    // Filter families based on group permissions
    // A family is visible if at least one of its members is in an accessible group
    if (Array.isArray(staffGroupPermissions) && staffGroupPermissions.length > 0) {
      const permittedMemberIds = new Set(
        groupMembers
          .filter(gm => staffGroupPermissions.includes(gm.groupID))
          .map(gm => gm.memberID)
      );
      
      families = families.filter(family => {
        const familyMembers = members.filter(m => m.familyID === family.familyID);
        return familyMembers.some(m => permittedMemberIds.has(m.memberID));
      });
    }

    // Apply search if provided
    if (search) {
      const searchFields = this.getSearchFields();
      families = families.filter(family =>
        searchFields.some(field =>
          family[field]?.toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    // Calculate member count for each family
    families = families.map(family => {
      const familyMembers = members.filter(m => m.familyID === family.familyID);
      const familyData = {
        ...family,
        memberCount: familyMembers.length,
      };
      
      // Include full member details if requested
      if (includemembers === 'true') {
        familyData.members = familyMembers;
      }
      
      return familyData;
    });

    // Apply pagination if requested
    if (page || limit) {
      const { paginate } = require('../../utils/helpers');
      const result = paginate(families, page, limit);
      return res.json(result);
    }

    res.json({
      success: true,
      data: families,
      total: families.length,
    });
  }

  /**
   * Override getById to include family members
   */
  async getById(req, res) {
    const { id } = req.params;

    const families = await sheetsService.getFamilies();
    const family = families.find(f => f.familyID === id);

    if (!family) {
      throw new ApiError('Family not found', 404);
    }

    // Get family members
    const members = await sheetsService.getMembers();
    family.members = members.filter(m => m.familyID === id);
    family.memberCount = family.members.length;

    res.json({
      success: true,
      data: family,
    });
  }

  /**
   * Add member to family
   * POST /api/families/:id/members
   */
  async addMember(req, res) {
    const { id } = req.params;
    const { memberId } = req.body;

    if (!memberId) {
      throw new ApiError('Member ID is required', 400);
    }

    // Verify family exists
    const families = await sheetsService.getFamilies();
    const family = families.find(f => f.familyID === id);

    if (!family) {
      throw new ApiError('Family not found', 404);
    }

    // Update member's family ID
    const success = await sheetsService.updateRow(
      sheetsService.SHEETS.MEMBERS,
      'MemberID',
      memberId,
      { FamilyID: id }
    );

    if (!success) {
      throw new ApiError('Member not found', 404);
    }

    res.json({
      success: true,
      message: 'Member added to family successfully',
    });
  }

  /**
   * Remove member from family
   * DELETE /api/families/:id/members/:memberId
   */
  async removeMember(req, res) {
    const { memberId } = req.params;

    // Clear member's family ID
    const success = await sheetsService.updateRow(
      sheetsService.SHEETS.MEMBERS,
      'MemberID',
      memberId,
      { FamilyID: '' }
    );

    if (!success) {
      throw new ApiError('Member not found', 404);
    }

    res.json({
      success: true,
      message: 'Member removed from family successfully',
    });
  }

  /**
   * Get family statistics
   * GET /api/families/stats
   */
  async getStats(req, res) {
    const families = await sheetsService.getFamilies();
    const members = await sheetsService.getMembers();

    const familyMembersCount = members.filter(m => m.familyID).length;

    const stats = {
      total: families.length,
      totalMembers: familyMembersCount,
      averageMembersPerFamily: families.length > 0 
        ? (familyMembersCount / families.length).toFixed(2) 
        : 0,
      largestFamily: families.reduce((max, f) => {
        const count = members.filter(m => m.familyID === f.familyID).length;
        return count > max.count ? { name: f.familyName, count } : max;
      }, { name: '', count: 0 }),
    };

    res.json({
      success: true,
      data: stats,
    });
  }
}

module.exports = new FamiliesController();
