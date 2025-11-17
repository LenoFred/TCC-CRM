/**
 * Check-in Service
 * Handles digital check-in/check-out for gatherings and events
 */

const sheetsService = require('./sheetsService');
const { generateId } = require('../utils/idGenerator');
const { logger } = require('../utils/logger');
const { ApiError } = require('../middlewares/errorHandler');

class CheckInService {
  /**
   * Check-in a member to a gathering
   */
  async checkIn(memberID, gatheringID, options = {}) {
    try {
      logger.info('Processing check-in', { memberID, gatheringID, options });

      // Fetch all required data in parallel for speed
      const [members, gatherings, attendanceData] = await Promise.all([
        sheetsService.getSheetObjects(sheetsService.SHEETS.MEMBERS),
        sheetsService.getSheetObjects(sheetsService.SHEETS.GATHERINGS),
        sheetsService.getSheetObjects(sheetsService.SHEETS.ATTENDANCE),
      ]);

      // Validate member exists
      const member = members.find((m) => m.memberID === memberID);
      if (!member) {
        throw new ApiError('Member not found', 404);
      }

      // Validate gathering exists
      const gathering = gatherings.find((g) => g.gatheringID === gatheringID);
      if (!gathering) {
        throw new ApiError('Gathering not found', 404);
      }

      // Check if already checked in
      const existingCheckIn = attendanceData.find(
        (a) =>
          a.memberID === memberID &&
          a.gatheringID === gatheringID
      );

      if (existingCheckIn) {
        throw new ApiError('Member already checked in', 400);
      }

      // Create attendance record (only 3 fields as per schema)
      const attendance = {
        attendanceID: generateId('ATTENDANCE'),
        memberID,
        gatheringID,
      };

      // Append single row instead of rewriting entire sheet (MUCH faster)
      const newRow = [
        attendance.attendanceID,
        attendance.memberID,
        attendance.gatheringID,
      ];

      await sheetsService.appendSheetData(sheetsService.SHEETS.ATTENDANCE, [newRow]);
      sheetsService.invalidateCache(sheetsService.SHEETS.ATTENDANCE);

      logger.info('Check-in successful', { attendanceID: attendance.attendanceID });

      return {
        attendance,
        member: {
          memberID: member.memberID,
          firstName: member.firstName,
          lastName: member.lastName,
        },
        gathering: {
          gatheringID: gathering.gatheringID,
          gatheringName: gathering.gatheringName,
          gatheringDate: gathering.gatheringDate,
        },
      };
    } catch (error) {
      logger.error('Error during check-in', { error: error.message });
      throw error;
    }
  }

  /**
   * Check-out a member from a gathering
   */
  async checkOut(memberID, gatheringID) {
    try {
      logger.info('Processing check-out', { memberID, gatheringID });

      const attendanceData = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.ATTENDANCE
      );
      
      // First check if there's an active check-in (no checkOutTime)
      const activeAttendanceIndex = attendanceData.findIndex(
        (a) => a.memberID === memberID && a.gatheringID === gatheringID && !a.checkOutTime
      );

      if (activeAttendanceIndex === -1) {
        // Check if they were checked in but already checked out
        const checkedOutAttendance = attendanceData.find(
          (a) => a.memberID === memberID && a.gatheringID === gatheringID && a.checkOutTime
        );
        
        if (checkedOutAttendance) {
          throw new ApiError('Member already checked out', 400);
        }
        
        throw new ApiError('Attendance record not found', 404);
      }

      const attendance = attendanceData[activeAttendanceIndex];

      // Update attendance with check-out time
      attendanceData[activeAttendanceIndex] = {
        ...attendance,
        checkOutTime: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const headers = [
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

      const rows = [
        headers,
        ...attendanceData.map((a) =>
          headers.map((h) => {
            const key = h.charAt(0).toLowerCase() + h.slice(1);
            return a[key] || '';
          })
        ),
      ];

      await sheetsService.updateSheetData(sheetsService.SHEETS.ATTENDANCE, rows);
      sheetsService.invalidateCache(sheetsService.SHEETS.ATTENDANCE);

      logger.info('Check-out successful', { memberID, gatheringID });

      return attendanceData[activeAttendanceIndex];
    } catch (error) {
      logger.error('Error during check-out', { error: error.message });
      throw error;
    }
  }

  /**
   * Bulk check-in multiple members
   */
  async bulkCheckIn(memberIDs, gatheringID, options = {}) {
    try {
      logger.info('Processing bulk check-in', {
        memberCount: memberIDs.length,
        gatheringID,
      });

      const results = {
        successful: [],
        failed: [],
      };

      for (const memberID of memberIDs) {
        try {
          const result = await this.checkIn(memberID, gatheringID, options);
          results.successful.push({
            memberID,
            attendance: result.attendance,
          });
        } catch (error) {
          results.failed.push({
            memberID,
            error: error.message,
          });
        }
      }

      logger.info('Bulk check-in completed', {
        successful: results.successful.length,
        failed: results.failed.length,
      });

      return results;
    } catch (error) {
      logger.error('Error during bulk check-in', { error: error.message });
      throw error;
    }
  }

  /**
   * Check-in via QR code
   */
  async checkInViaQR(qrCode, gatheringID) {
    try {
      // QR code format: "MEM-YYYYMMDD-XXXXX" (member ID)
      const memberID = qrCode;

      return await this.checkIn(memberID, gatheringID, {
        method: 'QR Code',
        notes: 'Checked in via QR code scan',
      });
    } catch (error) {
      logger.error('Error during QR check-in', { error: error.message });
      throw error;
    }
  }

  /**
   * Update gathering attendance count
   */
  async updateGatheringAttendance(gatheringID) {
    try {
      const gatherings = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.GATHERINGS
      );
      const gatheringIndex = gatherings.findIndex(
        (g) => g.gatheringID === gatheringID
      );

      if (gatheringIndex === -1) {
        return;
      }

      // Count actual attendance
      const attendanceData = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.ATTENDANCE
      );
      const count = attendanceData.filter(
        (a) =>
          a.gatheringID === gatheringID &&
          a.status?.toLowerCase() === 'present'
      ).length;

      // Don't update actualAttendance - gatherings sheet only has 6 fields
      // Just keep the original gathering data unchanged

      const headers = [
        'GatheringID',
        'GatheringName',
        'GatheringType',
        'ParentID',
        'GatheringDate',
        'GatheringTime',
      ];

      const rows = [
        headers,
        ...gatherings.map((g) =>
          headers.map((h) => {
            const key = h.charAt(0).toLowerCase() + h.slice(1);
            return g[key] || '';
          })
        ),
      ];

      await sheetsService.updateSheetData(sheetsService.SHEETS.GATHERINGS, rows);
      sheetsService.invalidateCache(sheetsService.SHEETS.GATHERINGS);
    } catch (error) {
      logger.error('Error updating gathering attendance', {
        error: error.message,
      });
    }
  }

  /**
   * Get current attendees for a gathering
   */
  async getCurrentAttendees(gatheringID) {
    try {
      const attendanceData = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.ATTENDANCE
      );

      // Get all checked-in members (not yet checked out)
      const currentAttendance = attendanceData.filter(
        (a) => a.gatheringID === gatheringID && !a.checkOutTime
      );

      // Get member details
      const members = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.MEMBERS
      );

      const attendees = currentAttendance.map((a) => {
        const member = members.find((m) => m.memberID === a.memberID);
        return {
          attendance: a,
          member: member
            ? {
                memberID: member.memberID,
                firstName: member.firstName,
                lastName: member.lastName,
                phone: member.phone,
                memberStatus: member.memberStatus,
              }
            : null,
        };
      });

      return {
        gatheringID,
        totalPresent: attendees.length,
        attendees,
      };
    } catch (error) {
      logger.error('Error getting current attendees', { error: error.message });
      throw error;
    }
  }

  /**
   * Get attendance report for a gathering
   */
  async getAttendanceReport(gatheringID) {
    try {
      const gathering = await sheetsService
        .getSheetObjects(sheetsService.SHEETS.GATHERINGS)
        .then((data) => data.find((g) => g.gatheringID === gatheringID));

      if (!gathering) {
        throw new ApiError('Gathering not found', 404);
      }

      const attendanceData = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.ATTENDANCE
      );
      const gatheringAttendance = attendanceData.filter(
        (a) => a.gatheringID === gatheringID
      );

      // Get member details
      const members = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.MEMBERS
      );

      const attendees = gatheringAttendance.map((a) => {
        const member = members.find((m) => m.memberID === a.memberID);
        return {
          ...a,
          memberName: member
            ? `${member.firstName} ${member.lastName}`
            : 'Unknown',
          memberStatus: member?.memberStatus || 'Unknown',
        };
      });

      // Calculate statistics
      const totalAttendance = attendees.length;
      const checkedIn = attendees.filter((a) => a.checkInTime).length;
      const checkedOut = attendees.filter((a) => a.checkOutTime).length;
      const stillPresent = checkedIn - checkedOut;

      // Check-in methods breakdown
      const methodBreakdown = {};
      attendees.forEach((a) => {
        const method = a.checkInMethod || 'Unknown';
        methodBreakdown[method] = (methodBreakdown[method] || 0) + 1;
      });

      // Member status breakdown (Members vs Guests)
      const statusBreakdown = {};
      attendees.forEach((a) => {
        const status = a.memberStatus || 'Unknown';
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      });

      return {
        gathering: {
          gatheringID: gathering.gatheringID,
          gatheringName: gathering.gatheringName,
          date: gathering.date,
          startTime: gathering.startTime,
          endTime: gathering.endTime,
          expectedAttendance: gathering.expectedAttendance,
        },
        statistics: {
          totalAttendance,
          checkedIn,
          checkedOut,
          stillPresent,
          attendanceRate:
            gathering.expectedAttendance
              ? Math.round(
                  (totalAttendance / parseInt(gathering.expectedAttendance)) * 100
                )
              : 0,
        },
        breakdowns: {
          byMethod: methodBreakdown,
          byMemberStatus: statusBreakdown,
        },
        attendees,
      };
    } catch (error) {
      logger.error('Error generating attendance report', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate QR code data for member
   */
  async generateMemberQR(memberID) {
    try {
      const members = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.MEMBERS
      );
      const member = members.find((m) => m.memberID === memberID);

      if (!member) {
        throw new ApiError('Member not found', 404);
      }

      // QR code data is just the member ID
      // Frontend can use a library like 'qrcode' to generate the actual QR image
      return {
        memberID: member.memberID,
        qrData: member.memberID,
        memberName: `${member.firstName} ${member.lastName}`,
        instructions:
          'Scan this QR code at any gathering to check in automatically',
      };
    } catch (error) {
      logger.error('Error generating member QR', { error: error.message });
      throw error;
    }
  }
}

module.exports = new CheckInService();
