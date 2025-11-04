/**
 * Families Controller
 * Handles all family-related operations
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');

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
    return {
      familyID: generateId('FAMILY'),
      familyName: data.familyName || '',
      createdDate: new Date().toISOString().split('T')[0],
      memberCount: data.memberCount || 0,
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
   * Override getAll to include family members
   */
  async getAll(req, res) {
    const { page, limit, search, includemembers } = req.query;

    // Get all families
    let families = await sheetsService.getFamilies();
    
    // Always get members to calculate member count
    const members = await sheetsService.getMembers();

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
