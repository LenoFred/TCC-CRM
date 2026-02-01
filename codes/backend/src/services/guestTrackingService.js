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

      if (!guestData.phone || !guestData.phone.trim()) {
        throw new ApiError('Phone number is required', 400);
      }

      // Check if guest already exists (by phone only - email is optional)
      const existingGuests = await this.findExistingGuest(
        guestData.phone
      );

      logger.info('Checking for existing guest', { 
        phone: guestData.phone, 
        foundCount: existingGuests.length 
      });

      if (existingGuests.length > 0) {
        // Guest already exists, just record attendance
        const existingGuest = existingGuests[0];
        
        logger.info('Guest already exists - recording attendance only', { 
          existingGuestID: existingGuest.guestID,
          existingGuestName: existingGuest.name,
          newGuestName: `${guestData.firstName} ${guestData.lastName}`
        });
        
        if (guestData.gatheringID) {
          await this.recordAttendance(existingGuest.guestID, guestData.gatheringID);
        }
        
        logger.info('Existing guest attendance recorded', { guestID: existingGuest.guestID });
        return { 
          guest: existingGuest, 
          isNew: false,
          message: 'Guest phone number already exists. Attendance recorded for existing guest.'
        };
      }

      // Create new guest
      const guestID = generateId('GUEST');
      const fullName = `${guestData.firstName} ${guestData.lastName}`;
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const guest = {
        guestID,
        name: fullName,
        phone: guestData.phone || '',
        email: guestData.email || '',
        date: currentDate, // Date when guest was added
      };

      logger.info('Creating new guest', { 
        guestID, 
        name: fullName, 
        phone: guest.phone,
        email: guest.email,
        date: guest.date 
      });

      // Add to Guest sheet (GuestID, Name, Phone, Email, Date)
      const newGuestRow = [
        guest.guestID,
        guest.name,
        guest.phone,
        guest.email,
        guest.date, // Include date column
      ];

      logger.info('Appending guest to Guest sheet', { 
        row: newGuestRow,
        sheet: sheetsService.SHEETS.GUEST 
      });

      await sheetsService.appendSheetData(sheetsService.SHEETS.GUEST, [newGuestRow]);
      sheetsService.invalidateCache(sheetsService.SHEETS.GUEST);

      logger.info('Guest saved to sheet successfully', { guestID });

      // Record attendance if gathering provided
      if (guestData.gatheringID) {
        await this.recordAttendance(guestID, guestData.gatheringID);
      }

      logger.info('Guest registered successfully', { guestID });
      return { guest, isNew: true };
    } catch (error) {
      logger.error('Error registering guest', { error: error.message });
      throw error;
    }
  }

  /**
   * Find existing guest by phone number only
   */
  async findExistingGuest(phone) {
    const guests = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.GUEST
    );

    // Only match by phone number (required field)
    return guests.filter(
      (g) => phone && g.phone && g.phone.trim() === phone.trim()
    );
  }

  /**
   * Record a return visit for existing guest (simplified for Guest sheet)
   */
  async recordVisit(guestID, visitData = {}) {
    try {
      logger.info('Recording guest visit', { guestID, visitData });

      // Simply record attendance for the existing guest
      if (visitData.gatheringID) {
        await this.recordAttendance(guestID, visitData.gatheringID);
      }

      // Get guest info from Guest sheet
      const guests = await sheetsService.getSheetObjects(
        sheetsService.SHEETS.GUEST
      );
      const guest = guests.find((g) => g.guestID === guestID);

      if (!guest) {
        throw new ApiError('Guest not found', 404);
      }

      logger.info('Guest visit recorded successfully', { guestID });
      return { guest, isNew: false };
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

      // Attendance sheet has only 3 columns: AttendanceID, MemberID, GatheringID
      const attendanceID = generateId('ATTENDANCE');
      const newAttendanceRow = [
        attendanceID,
        guestID, // GuestID goes in the MemberID column
        gatheringID,
      ];

      await sheetsService.appendSheetData(sheetsService.SHEETS.ATTENDANCE, [newAttendanceRow]);
      sheetsService.invalidateCache(sheetsService.SHEETS.ATTENDANCE);

      return { attendanceID, memberID: guestID, gatheringID };
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
    console.log('=== FETCHING GUESTS FROM SHEET ===');
    console.log('Sheet name:', sheetsService.SHEETS.GUEST);
    
    const guests = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.GUEST
    );
    
    console.log('Guests fetched:', guests.length);
    if (guests.length > 0) {
      console.log('First guest:', guests[0]);
      console.log('Guest keys:', Object.keys(guests[0]));
    }

    return guests;
  }

  /**
   * Get guest statistics with real-time conversion rate calculation
   */
  async getGuestStats() {
    const guests = await this.getAllGuests();
    const members = await sheetsService.getSheetObjects(
      sheetsService.SHEETS.MEMBERS
    );
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

    // Calculate real-time conversion rate by matching guests to members
    const convertedGuests = this.matchGuestsToMembers(guests, members);
    const conversionRate = totalGuests > 0 
      ? parseFloat(((convertedGuests.length / totalGuests) * 100).toFixed(1))
      : 0;

    return {
      totalGuests,
      firstTimeGuests,
      returningGuests,
      recentGuests,
      totalGuestAttendance: guestAttendance.length,
      convertedGuests: convertedGuests.length,
      conversionRate,
      convertedGuestDetails: convertedGuests.slice(0, 10), // Last 10 conversions for reference
    };
  }

  /**
   * Match guests to members by phone number + name
   * Returns list of guests who have been converted to members
   */
  matchGuestsToMembers(guests, members) {
    const convertedGuests = [];

    // Normalize phone number for comparison (remove spaces, dashes, +)
    const normalizePhone = (phone) => {
      if (!phone) return '';
      return phone.toString().replace(/[\s\-+()]/g, '').trim();
    };

    // Normalize name for comparison (lowercase, trim)
    const normalizeName = (name) => {
      if (!name) return '';
      return name.toString().toLowerCase().trim();
    };

    guests.forEach((guest) => {
      const guestPhone = normalizePhone(guest.phone);
      const guestFirstName = normalizeName(guest.firstName);
      const guestLastName = normalizeName(guest.lastName);

      // Check if this guest has been converted to a member
      const matchedMember = members.find((member) => {
        const memberPhone = normalizePhone(member.phone || member.phoneNumber);
        const memberFirstName = normalizeName(member.firstName);
        const memberLastName = normalizeName(member.lastName);

        // Match by phone number (primary matching)
        const phoneMatch = guestPhone && memberPhone && guestPhone === memberPhone;

        // Match by first name OR last name (secondary matching)
        const nameMatch = 
          (guestFirstName && memberFirstName && guestFirstName === memberFirstName) ||
          (guestLastName && memberLastName && guestLastName === memberLastName);

        // Consider converted if phone matches, or both phone and name match
        // This handles cases where phone might be slightly different but names match
        return phoneMatch || (phoneMatch && nameMatch);
      });

      if (matchedMember) {
        convertedGuests.push({
          guestID: guest.memberID,
          guestName: `${guest.firstName} ${guest.lastName}`,
          guestPhone: guest.phone,
          memberID: matchedMember.memberID,
          memberName: `${matchedMember.firstName} ${matchedMember.lastName}`,
          guestJoinDate: guest.joinDate,
          memberJoinDate: matchedMember.joinDate,
        });
      }
    });

    logger.info('Guest to member conversion calculated', {
      totalGuests: guests.length,
      convertedCount: convertedGuests.length,
      conversionRate: guests.length > 0 
        ? `${((convertedGuests.length / guests.length) * 100).toFixed(1)}%`
        : '0%',
    });

    return convertedGuests;
  }
}

module.exports = new GuestTrackingService();
