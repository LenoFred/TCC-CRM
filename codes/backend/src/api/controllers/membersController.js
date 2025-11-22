/**
 * Members Controller
 * Handles all member-related operations
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');

class MembersController extends BaseController {
  constructor() {
    super(sheetsService, sheetsService.SHEETS.MEMBERS, 'Member');
  }

  getSearchFields() {
    return ['firstName', 'lastName', 'email', 'phone', 'memberStatus'];
  }

  getDefaultHeaders() {
    return [
      'MemberID', 'FirstName', 'LastName', 'Email', 'PhoneNumber',
      'DOB', 'Gender', 'Address', 'State', 'LGA', 'FamilyID', 'FamilyRole',
      'Status', 'MemberType', 'EmergencyContact', 'JoinDate',
      'CreatedAt', 'UpdatedAt'
    ];
  }

  getIdColumn() {
    return 'MemberID';
  }

  async prepareCreateData(data, user) {
    return {
      memberID: generateId('MEMBER'),
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phoneNumber: data.phone || data.phoneNumber || '',
      dOB: data.dateOfBirth || data.dOB || '',
      gender: data.gender || '',
      address: data.address || '',
      state: data.state || '',
      lGA: data.lga || '',
      familyID: data.familyId || data.familyID || '',
      familyRole: data.familyRole || '',
      status: data.status || data.memberStatus || 'Active',  // Use 'status' to match sheet column
      memberType: data.membershipType || data.memberType || '',
      emergencyContact: data.emergencyContact || '',
      joinDate: data.joinDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async prepareUpdateData(data, user) {
    const updateData = {};
    
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined || data.phoneNumber !== undefined) {
      updateData.phoneNumber = data.phone || data.phoneNumber;
    }
    if (data.dateOfBirth !== undefined || data.dOB !== undefined) {
      updateData.dOB = data.dateOfBirth || data.dOB;
    }
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.lga !== undefined || data.lGA !== undefined) {
      updateData.lGA = data.lga || data.lGA;
    }
    if (data.familyId !== undefined || data.familyID !== undefined) {
      updateData.familyID = data.familyId || data.familyID;
    }
    if (data.familyRole !== undefined) {
      updateData.familyRole = data.familyRole;
    }
    // Status field - map to "Status" column in sheets (not "MemberStatus")
    const statusValue = data.status || data.memberStatus;
    if (statusValue !== undefined) {
      updateData.status = statusValue;  // Changed from memberStatus to status
    }
    if (data.membershipType !== undefined || data.memberType !== undefined) {
      updateData.memberType = data.membershipType || data.memberType;
    }
    if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact;
    // Note: joinDate is NOT included here - it should only be set when member is created
    
    updateData.updatedAt = new Date().toISOString();
    
    console.log('PrepareUpdateData - Input:', data);
    console.log('PrepareUpdateData - Output:', updateData);
    
    return updateData;
  }

  async update(req, res) {
    const { id } = req.params;
    console.log('=== UPDATE REQUEST ===');
    console.log('Member ID:', id);
    console.log('Request body:', req.body);
    
    const updates = await this.prepareUpdateData(req.body, req.user);
    
    console.log('=== PREPARED UPDATES FOR SHEETS ===');
    console.log('Updates object:', updates);
    console.log('Status field:', updates.status);
    console.log('LGA field:', updates.lGA);

    const idColumn = this.getIdColumn();
    const success = await this.sheetsService.updateRow(
      this.sheetName,
      idColumn,
      id,
      updates
    );
    
    console.log('=== UPDATE RESULT ===');
    console.log('Success:', success);

    if (!success) {
      throw new ApiError(`${this.entityName} not found`, 404);
    }

    res.json({
      success: true,
      message: `${this.entityName} updated successfully`,
    });
  }

  applyFilters(data, filters) {
    let filtered = data;

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(m => 
        m.memberStatus?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Filter by family
    if (filters.familyId) {
      filtered = filtered.filter(m => m.familyID === filters.familyId);
    }

    // Filter by gender
    if (filters.gender) {
      filtered = filtered.filter(m => 
        m.gender?.toLowerCase() === filters.gender.toLowerCase()
      );
    }

    // Filter by state
    if (filters.state) {
      filtered = filtered.filter(m => 
        m.state?.toLowerCase() === filters.state.toLowerCase()
      );
    }

    // Filter by LGA (Local Government Area)
    if (filters.lga) {
      filtered = filtered.filter(m => 
        m.lGA?.toLowerCase() === filters.lga.toLowerCase()
      );
    }

    return filtered;
  }

  /**
   * Get member with family details
   * GET /api/members/:id/family
   */
  async getMemberWithFamily(req, res) {
    const { id } = req.params;

    const members = await sheetsService.getMembers();
    const member = members.find(m => m.memberID === id);

    if (!member) {
      throw new ApiError('Member not found', 404);
    }

    // Get family if member has one
    if (member.familyID) {
      const families = await sheetsService.getFamilies();
      const family = families.find(f => f.familyID === member.familyID);
      
      if (family) {
        member.family = family;
      }
    }

    res.json({
      success: true,
      data: member,
    });
  }

  /**
   * Get members by family
   * GET /api/members/family/:familyId
   */
  async getMembersByFamily(req, res) {
    const { familyId } = req.params;

    const members = await sheetsService.getMembers();
    const familyMembers = members.filter(m => m.familyID === familyId);

    res.json({
      success: true,
      data: familyMembers,
      total: familyMembers.length,
    });
  }

  /**
   * Get member statistics
   * GET /api/members/stats
   */
  async getStats(req, res) {
    const members = await sheetsService.getMembers();

    const stats = {
      total: members.length,
      active: members.filter(m => m.memberStatus === 'Active').length,
      inactive: members.filter(m => m.memberStatus === 'Inactive').length,
      children: members.filter(m => m.memberStatus === 'Child').length,
      guests: members.filter(m => m.memberStatus === 'Guest').length,
      byGender: {
        male: members.filter(m => m.gender === 'Male').length,
        female: members.filter(m => m.gender === 'Female').length,
        other: members.filter(m => m.gender === 'Other').length,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  }
}

module.exports = new MembersController();
