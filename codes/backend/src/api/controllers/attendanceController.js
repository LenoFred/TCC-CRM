/**
 * Attendance Controller
 * Handles attendance tracking for gatherings/events
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');

class AttendanceController extends BaseController {
  constructor() {
    super(sheetsService, sheetsService.SHEETS.ATTENDANCE, 'Attendance');
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

    const attendanceData = await sheetsService.getSheetObjects(this.sheetName);
    const attendance = attendanceData.filter(
      (a) => a.gatheringID === gatheringID
    );

    // Get member details
    const membersData = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.MEMBERS
    );

    const attendanceWithMembers = attendance.map((a) => {
      const member = membersData.find((m) => m.memberID === a.memberID);
      return {
        ...a,
        member: member
          ? {
              memberID: member.memberID,
              firstName: member.firstName,
              lastName: member.lastName,
              email: member.email,
              phone: member.phone,
            }
          : null,
      };
    });

    res.json({
      gatheringID,
      total: attendanceWithMembers.length,
      present: attendanceWithMembers.filter(
        (a) => a.status?.toLowerCase() === 'present'
      ).length,
      attendance: attendanceWithMembers,
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

    if (!gatheringID || !memberID) {
      throw new ApiError(400, 'Gathering ID and Member ID are required');
    }

    const attendanceData = {
      gatheringID,
      memberID,
      checkInTime: new Date().toISOString(),
      status: 'Present',
      checkInMethod: req.body.checkInMethod || 'Manual',
      notes: req.body.notes || '',
    };

    const result = await this.create(
      { body: attendanceData, user: req.user },
      res
    );
    return result;
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
