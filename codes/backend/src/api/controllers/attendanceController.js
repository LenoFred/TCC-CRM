/**
 * Attendance Controller
 * Handles attendance tracking for gatherings/events
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');
const { logger } = require('../../utils/logger');
const { getStaffGroupPermissions, hasAccessToGroup } = require('../../middlewares/groupPermissions');

class AttendanceController extends BaseController {
  constructor() {
    super(sheetsService, sheetsService.SHEETS.ATTENDANCE, 'Attendance');
  }

  /**
   * Override getAll to filter by group permissions
   * Attendance is filtered by the gathering's parentID (groupID)
   */
  async getAll(req, res) {
    const { page, limit, search, ...filters } = req.query;

    // Get all attendance records
    let attendanceData = await sheetsService.getSheetObjects(this.sheetName);
    
    // Get gatherings to determine which groups they belong to
    const gatherings = await sheetsService.getSheetObjects(sheetsService.SHEETS.GATHERINGS);
    
    // Filter attendance by group permissions (via gathering's parentID)
    const groupPermissions = getStaffGroupPermissions(req);
    if (groupPermissions !== null && groupPermissions.length > 0) {
      // Filter to only include attendance for gatherings in assigned groups
      const permittedGatheringIds = gatherings
        .filter(g => groupPermissions.includes(g.parentID))
        .map(g => g.gatheringID);
      
      attendanceData = attendanceData.filter(a => permittedGatheringIds.includes(a.gatheringID));
    }

    // Apply search if provided
    if (search) {
      const searchFields = this.getSearchFields();
      const searchLower = search.toLowerCase();
      attendanceData = attendanceData.filter((item) =>
        searchFields.some((field) =>
          item[field]?.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply custom filters
    attendanceData = this.applyFilters(attendanceData, filters);

    // Apply pagination if requested
    if (page || limit) {
      const pageNum = parseInt(page) || 1;
      const pageSize = parseInt(limit) || 10;
      const startIndex = (pageNum - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      return res.json({
        success: true,
        data: attendanceData.slice(startIndex, endIndex),
        total: attendanceData.length,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(attendanceData.length / pageSize),
      });
    }

    res.json({
      success: true,
      data: attendanceData,
      total: attendanceData.length,
    });
  }

  getSearchFields() {
    return ['status', 'checkInMethod'];
  }

  getDefaultHeaders() {
    return [
      'AttendanceID',
      'GatheringID',
      'MemberID',
      'CheckInTime',
      'CheckOutTime',
      'Status',
      'CheckInMethod',
      'Notes',
      'CreatedAt',
      'UpdatedAt',
    ];
  }

  getIdColumn() {
    return 'AttendanceID';
  }

  async prepareCreateData(data, user) {
    // Validate gathering exists
    const gatherings = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.GATHERINGS
    );
    const gathering = gatherings.find((g) => g.gatheringID === data.gatheringID);
    if (!gathering) {
      throw new ApiError(404, 'Gathering not found');
    }

    // Check if staff has access to this gathering's group
    if (gathering.parentID && user.req && !hasAccessToGroup(user.req, gathering.parentID)) {
      throw new ApiError(403, `You do not have access to take attendance for gatherings in this group (${gathering.parentID}). You can only take attendance for your assigned groups.`);
    }

    // Validate member exists
    const members = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.MEMBERS
    );
    const member = members.find((m) => m.memberID === data.memberID);
    if (!member) {
      throw new ApiError(404, 'Member not found');
    }

    // Check if member already checked in for this gathering
    const attendanceData = await sheetsService.getSheetObjects(this.sheetName);
    const existingCheckIn = attendanceData.find(
      (a) =>
        a.gatheringID === data.gatheringID &&
        a.memberID === data.memberID &&
        a.status?.toLowerCase() === 'present'
    );

    if (existingCheckIn) {
      throw new ApiError(400, 'Member already checked in for this gathering');
    }

    return {
      attendanceID: generateId('ATT'),
      gatheringID: data.gatheringID,
      memberID: data.memberID,
      checkInTime: data.checkInTime || new Date().toISOString(),
      checkOutTime: data.checkOutTime || '',
      status: data.status || 'Present',
      checkInMethod: data.checkInMethod || 'Manual',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  applyFilters(data, filters) {
    let filteredData = data;

    if (filters.gatheringID) {
      filteredData = filteredData.filter(
        (item) => item.gatheringID === filters.gatheringID
      );
    }

    if (filters.memberID) {
      filteredData = filteredData.filter(
        (item) => item.memberID === filters.memberID
      );
    }

    if (filters.status) {
      filteredData = filteredData.filter(
        (item) => item.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.checkInMethod) {
      filteredData = filteredData.filter(
        (item) =>
          item.checkInMethod?.toLowerCase() === filters.checkInMethod.toLowerCase()
      );
    }

    return filteredData;
  }

  /**
   * Get attendance for a specific gathering
   */
  async getByGathering(req, res) {
    const { gatheringID } = req.params;

    // Check group permissions for this gathering
    const staffId = req.user?.memberId || req.user?.staffId || req.user?.userId;
    if (staffId) {
      const gatheringsData = await sheetsService.getSheetObjects(sheetsService.SHEETS.GATHERINGS);
      const gathering = gatheringsData.find(g => g.gatheringID === gatheringID);
      
      if (gathering && gathering.groupID) {
        const groupPermissions = await getStaffGroupPermissions(staffId);
        if (groupPermissions !== null && !groupPermissions.includes(gathering.groupID)) {
          throw new ApiError(403, 'You do not have permission to view attendance for this group');
        }
      }
    }

    const attendanceData = await sheetsService.getSheetObjects(this.sheetName);
    const attendance = attendanceData.filter(
      (a) => a.gatheringID === gatheringID
    );

    // Get member and guest details
    const membersData = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.MEMBERS
    );
    const guestsData = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.GUEST
    );

    logger.info('Attendance lookup details:', {
      gatheringID,
      attendanceCount: attendance.length,
      membersCount: membersData.length,
      guestsCount: guestsData.length,
      sampleMember: membersData[0],
      sampleGuest: guestsData[0]
    });

    const attendanceWithDetails = attendance.map((a) => {
      // Try to find as member first
      const member = membersData.find((m) => m.memberID === a.memberID);
      if (member) {
        logger.info('Found member:', {
          memberID: member.memberID,
          name: `${member.firstName} ${member.lastName}`,
          phoneNumber: member.phoneNumber
        });
        return {
          ...a,
          member: {
            memberID: member.memberID,
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            phoneNumber: member.phoneNumber,
            type: 'member'
          },
        };
      }
      
      // Try to find as guest
      const guest = guestsData.find((g) => g.guestID === a.memberID);
      if (guest) {
        logger.info('Found guest:', {
          guestID: guest.guestID,
          name: guest.name,
          phone: guest.phone
        });
        return {
          ...a,
          member: {
            memberID: guest.guestID,
            firstName: guest.name ? guest.name.split(' ')[0] : 'Guest',
            lastName: guest.name ? guest.name.split(' ').slice(1).join(' ') : '',
            email: guest.email,
            phoneNumber: guest.phone,
            type: 'guest'
          },
        };
      }
      
      // Not found in either sheet
      logger.warn('Attendee not found in Members or Guest sheets:', { memberID: a.memberID });
      return {
        ...a,
        member: null,
      };
    });

    res.json({
      gatheringID,
      total: attendanceWithDetails.length,
      present: attendanceWithDetails.filter(
        (a) => a.status?.toLowerCase() === 'present'
      ).length,
      attendance: attendanceWithDetails,
    });
  }

  /**
   * Get attendance for a specific member
   */
  async getByMember(req, res) {
    const { memberID } = req.params;

    const attendanceData = await sheetsService.getSheetObjects(this.sheetName);
    const attendance = attendanceData.filter((a) => a.memberID === memberID);

    // Get gathering details
    const gatheringsData = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.GATHERINGS
    );

    const attendanceWithGatherings = attendance.map((a) => {
      const gathering = gatheringsData.find((g) => g.gatheringID === a.gatheringID);
      return {
        ...a,
        gathering: gathering
          ? {
              gatheringID: gathering.gatheringID,
              gatheringName: gathering.gatheringName,
              gatheringType: gathering.gatheringType,
              gatheringDate: gathering.gatheringDate,
              gatheringTime: gathering.gatheringTime,
            }
          : null,
      };
    });

    res.json({
      memberID,
      total: attendanceWithGatherings.length,
      attendance: attendanceWithGatherings,
    });
  }

  /**
   * Check-in member
   */
  async checkIn(req, res) {
    const { gatheringID, memberID } = req.body;

    console.log('=== CHECK-IN DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Sheet name:', this.sheetName);

    if (!gatheringID || !memberID) {
      throw new ApiError(400, 'Gathering ID and Member ID are required');
    }

    // Validate gathering exists
    const gatherings = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.GATHERINGS
    );
    const gathering = gatherings.find((g) => g.gatheringID === gatheringID);
    if (!gathering) {
      throw new ApiError(404, 'Gathering not found');
    }

    // Validate member exists
    const members = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.MEMBERS
    );
    const member = members.find((m) => m.memberID === memberID);
    if (!member) {
      throw new ApiError(404, 'Member not found');
    }

    // Check if already checked in
    const attendanceData = await sheetsService.getSheetObjects(this.sheetName);
    console.log('Current attendance records:', attendanceData.length);
    
    const existingCheckIn = attendanceData.find(
      (a) => a.gatheringID === gatheringID && a.memberID === memberID
    );

    if (existingCheckIn) {
      throw new ApiError(400, 'Member already checked in for this gathering');
    }

    // Create attendance record
    const attendanceID = generateId('ATT');
    const newRow = [attendanceID, memberID, gatheringID];

    console.log('Attempting to append row:', newRow);
    console.log('To sheet:', this.sheetName);

    try {
      // Append directly to sheet
      const result = await sheetsService.appendSheetData(this.sheetName, [newRow]);
      console.log('Append result:', result);
      
      sheetsService.invalidateCache(this.sheetName);

      // Membership automation: update Status and membershipLevel for this member
      try {
        const { automateMembershipStatusAndLevel } = require('../../services/onboardingService');
        await automateMembershipStatusAndLevel();
      } catch (automationError) {
        console.error('Membership automation error:', automationError);
      }

      logger.info('Check-in successful', { attendanceID, memberID, gatheringID });

      res.json({
        message: 'Check-in successful',
        data: {
          attendanceID,
          memberID,
          gatheringID,
        },
      });
    } catch (error) {
      console.error('=== APPEND ERROR ===', error);
      throw error;
    }
  }

  /**
   * Check-out member
   */
  async checkOut(req, res) {
    const { id } = req.params;

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const attendance = data.find((a) => this.matchId(a, id));

    if (!attendance) {
      throw new ApiError(404, 'Attendance record not found');
    }

    if (attendance.checkOutTime) {
      throw new ApiError(400, 'Member already checked out');
    }

    const updated = {
      ...attendance,
      checkOutTime: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.updateInSheet(attendance, updated, data, req.user);

    res.json({
      message: 'Check-out successful',
      data: updated,
    });
  }

  /**
   * Get attendance statistics
   */
  async getStats(req, res) {
    const { startDate, endDate } = req.query;

    let attendanceData = await sheetsService.getSheetObjects(this.sheetName);

    // Apply date filters if provided
    if (startDate || endDate) {
      const gatheringsData = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.GATHERINGS
      );

      if (startDate) {
        const filterStartDate = new Date(startDate);
        const validGatheringIDs = gatheringsData
          .filter((g) => new Date(g.date) >= filterStartDate)
          .map((g) => g.gatheringID);
        attendanceData = attendanceData.filter((a) =>
          validGatheringIDs.includes(a.gatheringID)
        );
      }

      if (endDate) {
        const filterEndDate = new Date(endDate);
        const validGatheringIDs = gatheringsData
          .filter((g) => new Date(g.date) <= filterEndDate)
          .map((g) => g.gatheringID);
        attendanceData = attendanceData.filter((a) =>
          validGatheringIDs.includes(a.gatheringID)
        );
      }
    }

    const totalRecords = attendanceData.length;
    const presentCount = attendanceData.filter(
      (a) => a.status?.toLowerCase() === 'present'
    ).length;
    const absentCount = attendanceData.filter(
      (a) => a.status?.toLowerCase() === 'absent'
    ).length;

    // Check-in methods distribution
    const methodDistribution = {};
    attendanceData.forEach((a) => {
      const method = a.checkInMethod || 'Unknown';
      methodDistribution[method] = (methodDistribution[method] || 0) + 1;
    });

    // Unique members
    const uniqueMembers = new Set(attendanceData.map((a) => a.memberID)).size;

    res.json({
      totalRecords,
      presentCount,
      absentCount,
      uniqueMembers,
      methodDistribution,
      dateRange: { startDate, endDate },
    });
  }
}

module.exports = new AttendanceController();
