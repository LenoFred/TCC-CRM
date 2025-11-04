/**
 * Check-in Service Tests
 */

const checkInService = require('../../src/services/checkInService');
const sheetsService = require('../../src/services/sheetsService');
const { ApiError } = require('../../src/middlewares/errorHandler');

// Mock dependencies
jest.mock('../../src/services/sheetsService');
jest.mock('../../src/utils/idGenerator', () => ({
  generateId: jest.fn((prefix) => `${prefix}-20250101-TEST${Math.random().toString(36).substr(2, 5).toUpperCase()}`),
}));
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Check-in Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkIn', () => {
    it('should check in member successfully', async () => {
      const member = createMockMember();
      const gathering = createMockGathering();

      sheetsService.getSheetObjects
        .mockResolvedValueOnce([member]) // Members
        .mockResolvedValueOnce([gathering]) // Gatherings
        .mockResolvedValueOnce([]); // Attendance (no existing check-in)

      sheetsService.updateSheetData.mockResolvedValue();
      sheetsService.invalidateCache.mockResolvedValue();

      const result = await checkInService.checkIn(
        member.memberID,
        gathering.gatheringID,
        { method: 'Manual' }
      );

      expect(result.attendance).toBeDefined();
      expect(result.attendance.memberID).toBe(member.memberID);
      expect(result.attendance.gatheringID).toBe(gathering.gatheringID);
      expect(result.attendance.checkInMethod).toBe('Manual');
      expect(result.attendance.checkInTime).toBeDefined();
      expect(result.member.memberID).toBe(member.memberID);
      expect(result.gathering.gatheringID).toBe(gathering.gatheringID);
      expect(sheetsService.updateSheetData).toHaveBeenCalled();
    });

    it('should throw error if member not found', async () => {
      sheetsService.getSheetObjects.mockResolvedValue([]);

      await expect(
        checkInService.checkIn('MEM-NOTFOUND', 'GAT-20250101-TEST1')
      ).rejects.toThrow('Member not found');
    });

    it('should throw error if gathering not found', async () => {
      const member = createMockMember();

      sheetsService.getSheetObjects
        .mockResolvedValueOnce([member])
        .mockResolvedValueOnce([]); // No gatherings

      await expect(
        checkInService.checkIn(member.memberID, 'GAT-NOTFOUND')
      ).rejects.toThrow('Gathering not found');
    });

    it('should throw error if already checked in', async () => {
      const member = createMockMember();
      const gathering = createMockGathering();
      const existingAttendance = createMockAttendance({
        memberID: member.memberID,
        gatheringID: gathering.gatheringID,
        checkOutTime: '', // Still checked in
      });

      sheetsService.getSheetObjects
        .mockResolvedValueOnce([member])
        .mockResolvedValueOnce([gathering])
        .mockResolvedValueOnce([existingAttendance]);

      await expect(
        checkInService.checkIn(member.memberID, gathering.gatheringID)
      ).rejects.toThrow('already checked in');
    });

    it('should update gathering attendance count', async () => {
      const member = createMockMember();
      const gathering = createMockGathering({ actualAttendance: 5 });

      // checkIn calls: members, gatherings, attendance
      // Then updateGatheringAttendance calls: gatherings, attendance again
      sheetsService.getSheetObjects
        .mockResolvedValueOnce([member]) // checkIn - members
        .mockResolvedValueOnce([gathering]) // checkIn - gatherings
        .mockResolvedValueOnce([]) // checkIn - attendance
        .mockResolvedValueOnce([gathering]) // updateGatheringAttendance - gatherings
        .mockResolvedValueOnce([]); // updateGatheringAttendance - attendance

      sheetsService.updateSheetData.mockResolvedValue();
      sheetsService.invalidateCache.mockResolvedValue();

      await checkInService.checkIn(member.memberID, gathering.gatheringID);

      // Should update both attendance and gatherings sheets
      expect(sheetsService.updateSheetData).toHaveBeenCalledTimes(2);
    });
  });

  describe('checkOut', () => {
    it('should check out member successfully', async () => {
      const attendance = createMockAttendance({
        checkOutTime: '', // Not checked out yet
      });

      sheetsService.getSheetObjects.mockResolvedValue([attendance]);
      sheetsService.updateSheetData.mockResolvedValue();
      sheetsService.invalidateCache.mockResolvedValue();

      const result = await checkInService.checkOut(
        attendance.memberID,
        attendance.gatheringID
      );

      expect(result.checkOutTime).toBeDefined();
      expect(result.checkOutTime).not.toBe('');
    });

    it('should throw error if no check-in found', async () => {
      sheetsService.getSheetObjects.mockResolvedValue([]);

      await expect(
        checkInService.checkOut('MEM-20250101-TEST1', 'GAT-20250101-TEST1')
      ).rejects.toThrow('Attendance record not found');
    });

    it('should throw error if already checked out', async () => {
      const attendance = createMockAttendance({
        checkOutTime: new Date().toISOString(), // Already checked out
      });

      sheetsService.getSheetObjects.mockResolvedValue([attendance]);

      await expect(
        checkInService.checkOut(attendance.memberID, attendance.gatheringID)
      ).rejects.toThrow('already checked out');
    });
  });

  describe('bulkCheckIn', () => {
    it('should check in multiple members successfully', async () => {
      const members = [
        createMockMember({ memberID: 'MEM-20250101-TEST1' }),
        createMockMember({ memberID: 'MEM-20250101-TEST2' }),
      ];
      const gathering = createMockGathering();

      // Each checkIn call needs: members, gatherings, attendance
      // Then updateGatheringAttendance needs: gatherings, attendance
      // For 2 members: (3 + 2) * 2 = 10 mock calls total
      sheetsService.getSheetObjects
        .mockResolvedValueOnce(members) // First checkIn - members
        .mockResolvedValueOnce([gathering]) // First checkIn - gatherings
        .mockResolvedValueOnce([]) // First checkIn - attendance
        .mockResolvedValueOnce([gathering]) // First updateGatheringAttendance - gatherings
        .mockResolvedValueOnce([]) // First updateGatheringAttendance - attendance
        .mockResolvedValueOnce(members) // Second checkIn - members
        .mockResolvedValueOnce([gathering]) // Second checkIn - gatherings
        .mockResolvedValueOnce([]) // Second checkIn - attendance
        .mockResolvedValueOnce([gathering]) // Second updateGatheringAttendance - gatherings
        .mockResolvedValueOnce([]); // Second updateGatheringAttendance - attendance

      sheetsService.updateSheetData.mockResolvedValue();
      sheetsService.invalidateCache.mockResolvedValue();

      const result = await checkInService.bulkCheckIn(
        ['MEM-20250101-TEST1', 'MEM-20250101-TEST2'],
        gathering.gatheringID
      );

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle partial failures', async () => {
      const members = [
        createMockMember({ memberID: 'MEM-20250101-TEST1' }),
      ];
      const gathering = createMockGathering();

      sheetsService.getSheetObjects
        .mockResolvedValueOnce(members)
        .mockResolvedValueOnce([gathering])
        .mockResolvedValueOnce([]);

      sheetsService.updateSheetData.mockResolvedValue();
      sheetsService.invalidateCache.mockResolvedValue();

      const result = await checkInService.bulkCheckIn(
        ['MEM-20250101-TEST1', 'MEM-NOTFOUND'],
        gathering.gatheringID
      );

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].memberID).toBe('MEM-NOTFOUND');
    });
  });

  describe('checkInViaQR', () => {
    it('should check in via QR code successfully', async () => {
      const member = createMockMember();
      const gathering = createMockGathering();

      sheetsService.getSheetObjects
        .mockResolvedValueOnce([member])
        .mockResolvedValueOnce([gathering])
        .mockResolvedValueOnce([]);

      sheetsService.updateSheetData.mockResolvedValue();
      sheetsService.invalidateCache.mockResolvedValue();

      const result = await checkInService.checkInViaQR(
        member.memberID,
        gathering.gatheringID
      );

      expect(result.attendance.checkInMethod).toBe('QR Code');
      expect(result.attendance.memberID).toBe(member.memberID);
    });

    it('should throw error if QR code invalid', async () => {
      sheetsService.getSheetObjects.mockResolvedValueOnce([]); // No members
      
      await expect(
        checkInService.checkInViaQR('', 'GAT-20250101-TEST1')
      ).rejects.toThrow('Member not found');
    });
  });

  describe('getCurrentAttendees', () => {
    it('should get currently checked-in attendees', async () => {
      const member = createMockMember();
      
      const attendances = [
        createMockAttendance({
          attendanceID: 'ATT-1',
          checkOutTime: '', // Still checked in
        }),
        createMockAttendance({
          attendanceID: 'ATT-2',
          checkOutTime: new Date().toISOString(), // Checked out
        }),
        createMockAttendance({
          attendanceID: 'ATT-3',
          checkOutTime: '', // Still checked in
        }),
      ];

      sheetsService.getSheetObjects
        .mockResolvedValueOnce(attendances)
        .mockResolvedValueOnce([member]);

      const result = await checkInService.getCurrentAttendees('GAT-20250101-TEST1');

      expect(result.attendees).toHaveLength(2);
      expect(result.totalPresent).toBe(2);
      expect(result.attendees.every((a) => !a.attendance.checkOutTime)).toBe(true);
    });
  });

  describe('getAttendanceReport', () => {
    it('should generate comprehensive attendance report', async () => {
      const gathering = createMockGathering({
        expectedAttendance: 10,
        actualAttendance: 8,
      });

      const member = createMockMember();
      
      const attendances = [
        createMockAttendance({
          checkInMethod: 'Manual',
          checkOutTime: '',
        }),
        createMockAttendance({
          attendanceID: 'ATT-2',
          checkInMethod: 'QR Code',
          checkOutTime: new Date().toISOString(),
        }),
        createMockAttendance({
          attendanceID: 'ATT-3',
          checkInMethod: 'Manual',
          checkOutTime: '',
        }),
      ];

      sheetsService.getSheetObjects
        .mockResolvedValueOnce([gathering])
        .mockResolvedValueOnce(attendances)
        .mockResolvedValueOnce([member]);

      const result = await checkInService.getAttendanceReport('GAT-20250101-TEST1');

      expect(result.gathering.gatheringID).toBe('GAT-20250101-TEST1');
      expect(result.statistics.totalAttendance).toBe(3);
      expect(result.statistics.checkedOut).toBe(1);
      expect(result.statistics.stillPresent).toBe(2);
      expect(result.breakdowns.byMethod).toBeDefined();
    });

    it('should throw error if gathering not found', async () => {
      sheetsService.getSheetObjects.mockResolvedValue([]);

      await expect(
        checkInService.getAttendanceReport('GAT-NOTFOUND')
      ).rejects.toThrow('Gathering not found');
    });
  });

  describe('generateMemberQR', () => {
    it('should generate QR data for member', async () => {
      const member = createMockMember();

      sheetsService.getSheetObjects.mockResolvedValue([member]);

      const result = await checkInService.generateMemberQR(member.memberID);

      expect(result.qrData).toBe(member.memberID);
      expect(result.memberID).toBe(member.memberID);
      expect(result.memberName).toBe(`${member.firstName} ${member.lastName}`);
    });

    it('should throw error if member not found', async () => {
      sheetsService.getSheetObjects.mockResolvedValue([]);

      await expect(
        checkInService.generateMemberQR('MEM-NOTFOUND')
      ).rejects.toThrow('Member not found');
    });
  });
});
