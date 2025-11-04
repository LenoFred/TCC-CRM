/**
 * Guest Tracking Service
 * Handles visitor management, guest registration, and guest-to-member conversion
 */

const sheetsService = require('./sheetsService');
const { generateId } = require('../utils/idGenerator');
const { logger } = require('../utils/logger');
const { ApiError } = require('../middlewares/errorHandler');

class GuestTrackingService {
  /**
   * Register a new guest visit
   */
  async registerGuest(guestData) {
    try {
      logger.info('Registering new guest', { guestData });

      // Validate required fields
      if (!guestData.firstName || !guestData.lastName) {
        throw new ApiError('First name and last name are required', 400);
      }

      // Check if guest already exists (by phone or email)
      const existingGuests = await this.findExistingGuest(
        guestData.phone,
        guestData.email
      );

      if (existingGuests.length > 0) {
        // Update existing guest with new visit
        return await this.recordVisit(existingGuests[0].memberID, {
          gatheringID: guestData.gatheringID,
          invitedBy: guestData.invitedBy,
        });
      }

      // Create new guest
      const guestID = generateId('GUEST');
      const guest = {
        guestID,
        firstName: guestData.firstName,
        lastName: guestData.lastName,
        phone: guestData.phone || '',
        email: guestData.email || '',
        address: guestData.address || '',
        invitedBy: guestData.invitedBy || '',
        firstVisitDate: new Date().toISOString().split('T')[0],
        lastVisitDate: new Date().toISOString().split('T')[0],
        visitCount: '1',
        status: 'Active',
        interests: guestData.interests || '',
        notes: guestData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to Members sheet with special status
      const membersData = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.MEMBERS
      );
      const memberHeaders = [
        'MemberID',
        'FirstName',
        'LastName',
        'Phone',
        'Email',
        'Address',
        'MemberStatus',
        'JoinDate',
        'Notes',
        'CreatedAt',
        'UpdatedAt',
      ];

      const guestAsMember = {
        memberID: guestID,
        firstName: guest.firstName,
        lastName: guest.lastName,
        phone: guest.phone,
        email: guest.email,
        address: guest.address,
        memberStatus: 'Guest',
        joinDate: guest.firstVisitDate,
        notes: `Guest - Invited by: ${guest.invitedBy}. ${guest.notes}`,
        createdAt: guest.createdAt,
        updatedAt: guest.updatedAt,
      };

      membersData.push(guestAsMember);
      const rows = [
        memberHeaders,
        ...membersData.map((m) =>
          memberHeaders.map((h) => {
            const key = h.charAt(0).toLowerCase() + h.slice(1);
            return m[key] || '';
          })
        ),
      ];

      await sheetsService.updateSheetData(sheetsService.SHEETS.MEMBERS, rows);
      sheetsService.invalidateCache(sheetsService.SHEETS.MEMBERS);

      // Record attendance if gathering provided
      if (guestData.gatheringID) {
        await this.recordAttendance(guestID, guestData.gatheringID);
      }

      logger.info('Guest registered successfully', { guestID });
      return { guest: guestAsMember, isNew: true };
    } catch (error) {
      logger.error('Error registering guest', { error: error.message });
      throw error;
    }
  }

  /**
   * Find existing guest by phone or email
   */
  async findExistingGuest(phone, email) {
    const members = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.MEMBERS
    );

    return members.filter(
      (m) =>
        m.memberStatus?.toLowerCase() === 'guest' &&
        ((phone && m.phone === phone) || (email && m.email === email))
    );
  }

  /**
   * Record a return visit for existing guest
   */
  async recordVisit(guestID, visitData = {}) {
    try {
      logger.info('Recording guest visit', { guestID, visitData });

      const members = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.MEMBERS
      );
      const guestIndex = members.findIndex((m) => m.memberID === guestID);

      if (guestIndex === -1) {
        throw new ApiError('Guest not found', 404);
      }

      const guest = members[guestIndex];

      // Update visit count and last visit date
      const currentCount = parseInt(guest.notes?.match(/Visits: (\d+)/)?.[1] || '1');
      const updatedNotes = guest.notes
        ? guest.notes.replace(/Visits: \d+/, `Visits: ${currentCount + 1}`)
        : `${guest.notes} Visits: ${currentCount + 1}`;

      members[guestIndex] = {
        ...guest,
        notes: updatedNotes,
        updatedAt: new Date().toISOString(),
      };

      const memberHeaders = [
        'MemberID',
        'FirstName',
        'LastName',
        'Phone',
        'Email',
        'Address',
        'MemberStatus',
        'JoinDate',
        'Notes',
        'CreatedAt',
        'UpdatedAt',
      ];

      const rows = [
        memberHeaders,
        ...members.map((m) =>
          memberHeaders.map((h) => {
            const key = h.charAt(0).toLowerCase() + h.slice(1);
            return m[key] || '';
          })
        ),
      ];

      await sheetsService.updateSheetData(sheetsService.SHEETS.MEMBERS, rows);
      sheetsService.invalidateCache(sheetsService.SHEETS.MEMBERS);

      // Record attendance if gathering provided
      if (visitData.gatheringID) {
        await this.recordAttendance(guestID, visitData.gatheringID);
      }

      logger.info('Guest visit recorded successfully', { guestID });
      return { guest: members[guestIndex], isNew: false };
    } catch (error) {
      logger.error('Error recording guest visit', { error: error.message });
      throw error;
    }
  }

  /**
   * Record attendance for guest
   */
  async recordAttendance(guestID, gatheringID) {
    try {
      const attendanceData = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.ATTENDANCE
      );

      // Check if already checked in
      const existingAttendance = attendanceData.find(
        (a) =>
          a.memberID === guestID &&
          a.gatheringID === gatheringID &&
          a.status?.toLowerCase() === 'present'
      );

      if (existingAttendance) {
        return existingAttendance;
      }

      const attendance = {
        attendanceID: generateId('ATT'),
        gatheringID,
        memberID: guestID,
        checkInTime: new Date().toISOString(),
        checkOutTime: '',
        status: 'Present',
        checkInMethod: 'Guest Registration',
        notes: 'Guest attendance',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      attendanceData.push(attendance);

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

      return attendance;
    } catch (error) {
      logger.error('Error recording attendance', { error: error.message });
      throw error;
    }
  }

  /**
   * Convert guest to member
   */
  async convertToMember(guestID, memberData = {}) {
    try {
      logger.info('Converting guest to member', { guestID, memberData });

      const members = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.MEMBERS
      );
      const guestIndex = members.findIndex((m) => m.memberID === guestID);

      if (guestIndex === -1) {
        throw new ApiError('Guest not found', 404);
      }

      const guest = members[guestIndex];

      if (guest.memberStatus?.toLowerCase() !== 'guest') {
        throw new ApiError('Member is not a guest', 400);
      }

      // Generate new member ID
      const newMemberID = generateId('MEM');

      // Update guest record to full member
      const updatedMember = {
        ...guest,
        memberID: newMemberID,
        memberStatus: 'Active',
        gender: memberData.gender || '',
        dateOfBirth: memberData.dateOfBirth || '',
        maritalStatus: memberData.maritalStatus || '',
        occupation: memberData.occupation || '',
        familyID: memberData.familyID || '',
        joinDate: new Date().toISOString().split('T')[0],
        notes: `Converted from guest (${guestID}) on ${new Date().toISOString().split('T')[0]}. ${memberData.notes || ''}`,
        updatedAt: new Date().toISOString(),
      };

      // Remove old guest record and add new member
      members.splice(guestIndex, 1);
      members.push(updatedMember);

      const memberHeaders = [
        'MemberID',
        'FirstName',
        'LastName',
        'Phone',
        'Email',
        'Address',
        'Gender',
        'DateOfBirth',
        'MaritalStatus',
        'Occupation',
        'FamilyID',
        'MemberStatus',
        'JoinDate',
        'Notes',
        'CreatedAt',
        'UpdatedAt',
      ];

      const rows = [
        memberHeaders,
        ...members.map((m) =>
          memberHeaders.map((h) => {
            const key = h.charAt(0).toLowerCase() + h.slice(1);
            return m[key] || '';
          })
        ),
      ];

      await sheetsService.updateSheetData(sheetsService.SHEETS.MEMBERS, rows);
      sheetsService.invalidateCache(sheetsService.SHEETS.MEMBERS);

      // Update attendance records with new member ID
      await this.updateAttendanceRecords(guestID, newMemberID);

      logger.info('Guest converted to member successfully', {
        guestID,
        newMemberID,
      });

      return {
        oldGuestID: guestID,
        newMember: updatedMember,
      };
    } catch (error) {
      logger.error('Error converting guest to member', { error: error.message });
      throw error;
    }
  }

  /**
   * Update attendance records after guest conversion
   */
  async updateAttendanceRecords(oldGuestID, newMemberID) {
    try {
      const attendanceData = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.ATTENDANCE
      );

      const updated = attendanceData.map((a) => {
        if (a.memberID === oldGuestID) {
          return {
            ...a,
            memberID: newMemberID,
            notes: `${a.notes || ''} [ID updated from ${oldGuestID}]`.trim(),
            updatedAt: new Date().toISOString(),
          };
        }
        return a;
      });

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
        ...updated.map((a) =>
          headers.map((h) => {
            const key = h.charAt(0).toLowerCase() + h.slice(1);
            return a[key] || '';
          })
        ),
      ];

      await sheetsService.updateSheetData(sheetsService.SHEETS.ATTENDANCE, rows);
      sheetsService.invalidateCache(sheetsService.SHEETS.ATTENDANCE);
    } catch (error) {
      logger.error('Error updating attendance records', { error: error.message });
      throw error;
    }
  }

  /**
   * Get all guests
   */
  async getAllGuests() {
    const members = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.MEMBERS
    );

    return members.filter((m) => m.memberStatus?.toLowerCase() === 'guest');
  }

  /**
   * Get guest statistics
   */
  async getGuestStats() {
    const guests = await this.getAllGuests();
    const attendanceData = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.ATTENDANCE
    );

    const totalGuests = guests.length;
    const guestIDs = guests.map((g) => g.memberID);

    // Guest attendance
    const guestAttendance = attendanceData.filter((a) =>
      guestIDs.includes(a.memberID)
    );

    // First time vs returning
    const firstTimeGuests = guests.filter((g) => {
      const visitCount = parseInt(g.notes?.match(/Visits: (\d+)/)?.[1] || '1');
      return visitCount === 1;
    }).length;

    const returningGuests = totalGuests - firstTimeGuests;

    // Recent guests (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentGuests = guests.filter((g) => {
      const joinDate = new Date(g.joinDate);
      return joinDate >= thirtyDaysAgo;
    }).length;

    return {
      totalGuests,
      firstTimeGuests,
      returningGuests,
      recentGuests,
      totalGuestAttendance: guestAttendance.length,
      conversionRate: 0, // TODO: Calculate from historical data
    };
  }
}

module.exports = new GuestTrackingService();
