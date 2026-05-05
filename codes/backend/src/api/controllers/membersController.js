/**
 * Members Controller
 * Handles all member-related operations
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');
const { formatDateOfBirth, formatPhoneNumber } = require('../../utils/dataFormatters');

class MembersController extends BaseController {
  constructor() {
    super(sheetsService, sheetsService.SHEETS.MEMBERS, 'Member');
  }

  /**
   * Override getAll to filter members by group permissions
   */
  async getAll(req, res) {
    const { page, limit, search, ...filters } = req.query;

    // Get all data
    let membersData = await sheetsService.getSheetObjects(this.sheetName);
    
    // Apply group permissions filtering
    const groupPermissions = req.user?.groupPermissions;
    
    // If groupPermissions is an array with values, filter members
    if (Array.isArray(groupPermissions) && groupPermissions.length > 0) {
      // Get group members to filter by permitted groups
      const groupMembers = await sheetsService.getSheetObjects(sheetsService.SHEETS.GROUP_MEMBERS);
      const permittedMemberIds = new Set(
        groupMembers
          .filter(gm => groupPermissions.includes(gm.groupID))
          .map(gm => gm.memberID)
      );
      membersData = membersData.filter(m => permittedMemberIds.has(m.memberID));
    }
    // If groupPermissions is null or undefined, show all members (admin or no restrictions)

    // Apply search if provided
    if (search) {
      const { searchFilter } = require('../../utils/helpers');
      const searchFields = this.getSearchFields();
      membersData = searchFilter(membersData, search, searchFields);
    }

    // Apply custom filters
    membersData = this.applyFilters(membersData, filters);

    // Apply pagination if requested
    if (page || limit) {
      const { paginate } = require('../../utils/helpers');
      const result = paginate(membersData, page, limit);
      return res.json(result);
    }

    res.json({
      success: true,
      data: membersData,
      total: membersData.length,
    });
  }

  getSearchFields() {
    return ['firstName', 'lastName', 'email', 'phone', 'memberStatus'];
  }

  getDefaultHeaders() {
      return [
        'MemberID', 'FirstName', 'LastName', 'Email', 'PhoneNumber',
        'DOB', 'Gender', 'Address', 'State', 'LGA', 'FamilyID', 'FamilyRole',
        'CLDS', 'Baptism', 'GBIC', 'ABIC',
        'membershipLevel',
        'Status', 'MemberType', 'EmergencyContact', 'JoinDate',
        'CreatedAt', 'UpdatedAt'
      ];
  }

  getIdColumn() {
    return 'MemberID';
  }

  /**
   * Check if member already exists using COMPOSITE KEY: FirstName + PhoneNumber
   * Also returns group information for smart group reassignment
   */
  async checkForDuplicateMember(firstName, phoneNumber, selectedGroupId = null) {
    const members = await sheetsService.getSheetObjects(sheetsService.SHEETS.MEMBERS);
    const groupMembers = await sheetsService.getSheetObjects(sheetsService.SHEETS.GROUP_MEMBERS);
    const { formatPhoneNumber } = require('../utils/dataFormatters');

    // Normalize phone to E.164 format for consistent comparison across all phone formats
    const normalizePhoneToE164 = (phone) => {
      if (!phone) return '';
      const phoneResult = formatPhoneNumber(phone);
      // Use E.164 format (e.g., +2348012345678) for consistent cross-format comparison
      // This handles: 08012345678, 2348012345678, +2348012345678 all normalize to same E.164
      return phoneResult.e164 || '';
    };

    // Normalize firstName for comparison (trim, case-insensitive)
    const normalizeFirstName = (name) => {
      if (!name) return '';
      return name.toString().trim().toLowerCase();
    };

    const inputPhoneE164 = normalizePhoneToE164(phoneNumber);
    const inputFirstName = normalizeFirstName(firstName);

    // Check for duplicate using COMPOSITE KEY: FirstName + PhoneNumber (E.164 format)
    // This ensures all phone number formats are treated consistently
    if (inputPhoneE164 && inputFirstName) {
      const duplicateMember = members.find(member => {
        const memberPhoneE164 = normalizePhoneToE164(member.phoneNumber || member.phone);
        const memberFirstName = normalizeFirstName(member.firstName);
        return memberPhoneE164 && memberPhoneE164 === inputPhoneE164 && memberFirstName === inputFirstName;
      });

      if (duplicateMember) {
        // Get groups this member belongs to
        const memberGroups = groupMembers.filter(gm => gm.memberID === duplicateMember.memberID);

        // Check if member is already in the selected group
        const alreadyInGroup = selectedGroupId && memberGroups.some(gm => gm.groupID === selectedGroupId);

        return {
          exists: true,
          member: duplicateMember,
          memberGroups: memberGroups,
          alreadyInSelectedGroup: alreadyInGroup,
          message: `Member ${duplicateMember.firstName} ${duplicateMember.lastName} (${duplicateMember.memberID}) already exists`,
          needsGroupReassignment: selectedGroupId && !alreadyInGroup // Flag to add to new group
        };
      }
    }

    return { exists: false };
  }

  /**
   * Check for duplicate member (for pre-submission validation)
   * Returns duplicate status without creating/modifying data
   * Used by frontend for real-time duplicate checking
   */
  async checkDuplicate(req, res) {
    try {
      const { firstName, phoneNumber, groupId } = req.body;

      // Validate required fields
      if (!firstName || !phoneNumber) {
        throw new ApiError(400, 'FirstName and PhoneNumber are required for duplicate check');
      }

      // Check for duplicate
      const duplicateCheck = await this.checkForDuplicateMember(
        firstName,
        phoneNumber,
        groupId
      );

      // Build response
      const response = {
        success: true,
        exists: duplicateCheck.exists
      };

      if (duplicateCheck.exists) {
        response.member = {
          memberID: duplicateCheck.member.memberID,
          firstName: duplicateCheck.member.firstName,
          lastName: duplicateCheck.member.lastName,
          groups: duplicateCheck.memberGroups.map(g => ({
            groupID: g.groupID,
            groupName: g.groupName || 'Unknown Group'
          }))
        };

        // Provide helpful suggestion based on duplicate status
        if (duplicateCheck.alreadyInSelectedGroup && groupId) {
          response.suggestion = `${duplicateCheck.member.firstName} is already in this group`;
          response.action = 'ALREADY_IN_GROUP';
        } else if (duplicateCheck.needsGroupReassignment && groupId) {
          response.suggestion = `${duplicateCheck.member.firstName} exists. You can add them to the selected group`;
          response.action = 'CAN_REASSIGN';
        } else if (groupId) {
          response.suggestion = `${duplicateCheck.member.firstName} exists with groups: ${duplicateCheck.memberGroups.map(g => g.groupName || 'Unknown').join(', ')}`;
          response.action = 'EXISTS';
        } else {
          response.suggestion = `${duplicateCheck.member.firstName} ${duplicateCheck.member.lastName} already exists`;
          response.action = 'EXISTS';
        }
      }

      res.json(response);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ error: error.message, statusCode: error.statusCode });
      } else {
        console.error('Error checking duplicate:', error);
        res.status(500).json({ error: 'Failed to check for duplicates', statusCode: 500 });
      }
    }
  }

  async prepareCreateData(data, user) {
    // Format and validate phone number
    const phoneInput = data.phone || data.phoneNumber || '';
    const phoneResult = formatPhoneNumber(phoneInput);
    
    if (phoneInput && !phoneResult.isValid) {
      throw new ApiError(400, `Invalid phone number format: ${phoneInput}. Please use format: 08012345678 or +2348012345678`);
    }
    
    if (phoneInput && !phoneResult.isValidForTwilio) {
      console.warn(`[Members] Phone number may not work with SMS: ${phoneInput}`);
    }
    
    // Format and validate DOB
    const dobInput = data.dateOfBirth || data.dOB || '';
    const formattedDOB = dobInput ? formatDateOfBirth(dobInput) : '';
    
    if (dobInput && !formattedDOB) {
      throw new ApiError(400, `Invalid date of birth format: ${dobInput}. Please use format: YYYY-MM-DD`);
    }
    
    return {
      memberID: generateId('MEMBER'),
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phoneNumber: phoneResult.e164 || phoneInput, // Store in E.164 format for SMS compatibility
      dOB: formattedDOB,
      gender: data.gender || '',
      address: data.address || '',
      state: data.state || '',
      lGA: data.lga || '',
      familyID: data.familyId || data.familyID || '',
      familyRole: data.familyRole || '',
      CLDS: 'Not Started',
      Baptism: 'Not Done',
      GBIC: 'Not Started',
      ABIC: 'Not Started',
      membershipLevel: data.membershipLevel || '',
      status: data.status || data.memberStatus || 'Active',  // Use 'status' to match sheet column
      memberType: data.membershipType || data.memberType || '',
      emergencyContact: data.emergencyContact || '',
      joinDate: data.joinDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async prepareUpdateData(data, user) {
    // CLDS, Baptism, GBIC, ABIC fields
    const updateData = {};
    if (data.CLDS !== undefined) updateData.CLDS = data.CLDS;
    if (data.Baptism !== undefined) updateData.Baptism = data.Baptism;
    if (data.GBIC !== undefined) updateData.GBIC = data.GBIC;
    if (data.ABIC !== undefined) updateData.ABIC = data.ABIC;
    if (data.membershipLevel !== undefined) updateData.membershipLevel = data.membershipLevel;
    
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    
    // Format and validate phone number if provided
    if (data.phone !== undefined || data.phoneNumber !== undefined) {
      const phoneInput = data.phone || data.phoneNumber;
      if (phoneInput) {
        const phoneResult = formatPhoneNumber(phoneInput);
        
        if (!phoneResult.isValid) {
          throw new ApiError(400, `Invalid phone number format: ${phoneInput}. Please use format: 08012345678 or +2348012345678`);
        }
        
        if (!phoneResult.isValidForTwilio) {
          console.warn(`[Members] Phone number may not work with SMS: ${phoneInput}`);
        }
        
        updateData.phoneNumber = phoneResult.e164 || phoneInput;
      } else {
        updateData.phoneNumber = phoneInput; // Allow clearing phone number
      }
    }
    
    // Format and validate DOB if provided
    if (data.dateOfBirth !== undefined || data.dOB !== undefined) {
      const dobInput = data.dateOfBirth || data.dOB;
      if (dobInput) {
        const formattedDOB = formatDateOfBirth(dobInput);
        
        if (!formattedDOB) {
          throw new ApiError(400, `Invalid date of birth format: ${dobInput}. Please use format: YYYY-MM-DD`);
        }
        
        updateData.dOB = formattedDOB;
      } else {
        updateData.dOB = dobInput; // Allow clearing DOB
      }
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
   * Create new member with duplicate checking
   * POST /api/members
   */
  async create(req, res) {
    // Check for duplicates using composite key: FirstName + PhoneNumber
    const firstName = req.body.firstName || '';
    const phoneInput = req.body.phone || req.body.phoneNumber || '';
    const selectedGroupId = req.body.groupID || null; // Optional: group to add member to
    
    const duplicateCheck = await this.checkForDuplicateMember(firstName, phoneInput, selectedGroupId);
    
    if (duplicateCheck.exists) {
      // Member exists - check group scenarios
      if (duplicateCheck.alreadyInSelectedGroup) {
        // Member already in selected group
        throw new ApiError(`Member ${duplicateCheck.member.firstName} ${duplicateCheck.member.lastName} already exists in the selected group`, 409);
      } else if (duplicateCheck.needsGroupReassignment) {
        // Member exists but not in selected group - add to group
        console.log(`✅ Member exists, adding to new group: ${duplicateCheck.member.memberID} to group ${selectedGroupId}`);
        
        const groupMemberId = generateId('GROUP_MEMBER');
        const groupMemberRow = [
          groupMemberId,
          selectedGroupId,
          duplicateCheck.member.memberID,
          'Active'
        ];
        
        // Append to GroupMembers sheet
        await sheetsService.sheets.spreadsheets.values.append({
          spreadsheetId: sheetsService.MAIN_SHEET_ID,
          range: 'GroupMembers!A1',
          valueInputOption: 'RAW',
          resource: { values: [groupMemberRow] }
        });
        
        // Clear cache
        sheetsService.cache.flushAll();
        
        return res.json({
          success: true,
          message: `Member ${duplicateCheck.member.firstName} ${duplicateCheck.member.lastName} already exists and has been added to the selected group`,
          data: {
            memberID: duplicateCheck.member.memberID,
            groupMemberID: groupMemberId,
            existing: true,
            addedToGroup: true
          },
          statusCode: 200
        });
      } else {
        // Member exists in different group, but no specific group requested
        throw new ApiError(`Member ${duplicateCheck.member.firstName} ${duplicateCheck.member.lastName} already exists (in ${duplicateCheck.memberGroups.length} group(s))`, 409);
      }
    }
    
    // If no duplicate found, proceed with normal creation
    return super.create(req, res);
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
   * Override create to trigger new member welcome automation
   * POST /api/members
   */
  async create(req, res) {
    // Call parent create method
    await super.create(req, res);

    // If successful, trigger new member automation
    if (res.statusCode === 201) {
      const memberData = res.locals.data || req.body;
      
      // Trigger automation asynchronously (don't wait for it)
      setImmediate(async () => {
        try {
          const schedulerService = require('../../services/schedulerService');
          await schedulerService.triggerAutomationImmediately('new_member', {
            firstName: memberData.firstName,
            lastName: memberData.lastName,
            phoneNumber: memberData.phone || memberData.phoneNumber,
            email: memberData.email,
            joinDate: memberData.joinDate || new Date().toISOString().split('T')[0]
          });
        } catch (error) {
          console.error('Failed to trigger new member automation:', error);
          // Don't fail the request if automation fails
        }
      });
    }
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
      active: members.filter(m => (m.memberStatus || m.status) === 'Active').length,
      inactive: members.filter(m => (m.memberStatus || m.status) === 'Inactive').length,
      children: members.filter(m => (m.memberStatus || m.status) === 'Child').length,
      guests: members.filter(m => (m.memberStatus || m.status) === 'Guest').length,
      byGender: {
        male: members.filter(m => m.gender === 'Male').length,
        female: members.filter(m => m.gender === 'Female').length,
        other: members.filter(m => m.gender === 'Other').length,
      },
    };

    // Debug logging
    console.log('=== MEMBERS STATS DEBUG ===');
    console.log('Total members:', stats.total);
    console.log('Active members:', stats.active);
    console.log('Sample member object:', members[0]);
    console.log('Member statuses found:', [...new Set(members.map(m => m.memberStatus || m.status))]);

    res.json({
      success: true,
      data: stats,
    });
  }
}

module.exports = new MembersController();
