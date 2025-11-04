/**
 * Guest Tracking Service Tests
 */

const guestTrackingService = require('../../src/services/guestTrackingService');
const sheetsService = require('../../src/services/sheetsService');
const { ApiError } = require('../../src/middlewares/errorHandler');

// Mock dependencies
jest.mock('../../src/services/sheetsService');
jest.mock('../../src/utils/idGenerator', () => ({
  generateId: (prefix) => `${prefix}-20250101-TEST1`,
}));
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Guest Tracking Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerGuest', () => {
    it('should register a new guest successfully', async () => {
      const guestData = {
        firstName: 'John',
        lastName: 'Visitor',
        phone: '+2348012345678',
        email: 'john@example.com',
      };

      sheetsService.getSheetObjects
        .mockResolvedValueOnce([]) // findExistingGuest
        .mockResolvedValueOnce([]); // registerGuest - get members to add to
      sheetsService.updateSheetData.mockResolvedValue();
      sheetsService.invalidateCache.mockResolvedValue();

      const result = await guestTrackingService.registerGuest(guestData);

      expect(result).toBeDefined();
      expect(result.isNew).toBe(true);
      expect(result.guest).toBeDefined();
      expect(result.guest.firstName).toBe('John');
      expect(result.guest.memberStatus).toBe('Guest');
      expect(result.guest.memberID).toBeDefined();
      expect(result.guest.memberID).toContain('GUEST-');
      expect(sheetsService.updateSheetData).toHaveBeenCalled();
    });

    it('should record visit for existing guest', async () => {
      const existingGuest = createMockGuest({
        memberID: 'GUEST-123',
        phone: '+2348012345678',
        notes: 'Visits: 2',
      });

      const guestData = {
        firstName: 'John',
        lastName: 'Visitor',
        phone: '+2348012345678',
        email: 'john@example.com',
      };

      // findExistingGuest call, then recordVisit needs to get and update members
      sheetsService.getSheetObjects
        .mockResolvedValueOnce([existingGuest]) // findExistingGuest
        .mockResolvedValueOnce([existingGuest]); // recordVisit - get members
      sheetsService.updateSheetData.mockResolvedValue();
      sheetsService.invalidateCache.mockResolvedValue();

      const result = await guestTrackingService.registerGuest(guestData);

      expect(result.isNew).toBe(false);
      expect(result.guest.notes).toContain('Visits: 3');
    });

    it('should create attendance record if gatheringID provided', async () => {
      const guestData = {
        firstName: 'John',
        lastName: 'Visitor',
        phone: '+2348012345678',
        email: 'john@example.com',
        gatheringID: 'GAT-20250101-TEST1',
      };

      sheetsService.getSheetObjects
        .mockResolvedValueOnce([]) // findExistingGuest - Members sheet
        .mockResolvedValueOnce([]) // registerGuest - Members sheet
        .mockResolvedValueOnce([]); // recordAttendance - Attendance sheet

      sheetsService.updateSheetData.mockResolvedValue();
      sheetsService.invalidateCache.mockResolvedValue();

      const result = await guestTrackingService.registerGuest(guestData);

      // registerGuest doesn't return attendance, need to verify it was called
      expect(result.isNew).toBe(true);
      expect(sheetsService.updateSheetData).toHaveBeenCalledTimes(2); // Members + Attendance
    });

    it('should throw error if required fields missing', async () => {
      const invalidData = {
        firstName: 'John',
        // Missing required fields
      };

      await expect(
        guestTrackingService.registerGuest(invalidData)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('findExistingGuest', () => {
    it('should find guest by phone', async () => {
      const existingGuest = createMockGuest({
        phone: '+2348012345678',
      });

      sheetsService.getSheetObjects.mockResolvedValue([existingGuest]);

      const result = await guestTrackingService.findExistingGuest(
        '+2348012345678',
        'different@email.com'
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].phone).toBe('+2348012345678');
    });

    it('should find guest by email', async () => {
      const existingGuest = createMockGuest({
        email: 'guest@example.com',
      });

      sheetsService.getSheetObjects.mockResolvedValue([existingGuest]);

      const result = await guestTrackingService.findExistingGuest(
        '+2349999999999',
        'guest@example.com'
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].email).toBe('guest@example.com');
    });

    it('should return null if guest not found', async () => {
      sheetsService.getSheetObjects.mockResolvedValue([]);

      const result = await guestTrackingService.findExistingGuest(
        '+2349999999999',
        'notfound@example.com'
      );

      expect(result).toEqual([]);
    });
  });

  describe('convertToMember', () => {
    it('should convert guest to member successfully', async () => {
      const guest = createMockGuest({
        memberID: 'GUEST-20250101-TEST1',
      });

      const attendance = createMockAttendance({
        memberID: 'GUEST-20250101-TEST1',
      });

      sheetsService.getSheetObjects
        .mockResolvedValueOnce([guest]) // Members sheet
        .mockResolvedValueOnce([attendance]); // Attendance sheet

      sheetsService.updateSheetData.mockResolvedValue();
      sheetsService.invalidateCache.mockResolvedValue();

      const result = await guestTrackingService.convertToMember(
        'GUEST-20250101-TEST1',
        { dateOfBirth: '1990-01-01' }
      );

      expect(result.newMember.memberID).toContain('MEM-');
      expect(result.newMember.memberStatus).toBe('Active');
      expect(result.oldGuestID).toBe('GUEST-20250101-TEST1');
      expect(sheetsService.updateSheetData).toHaveBeenCalledTimes(2);
    });

    it('should throw error if guest not found', async () => {
      sheetsService.getSheetObjects.mockResolvedValue([]);

      await expect(
        guestTrackingService.convertToMember('GUEST-NOTFOUND')
      ).rejects.toThrow(ApiError);
    });

    it('should throw error if trying to convert non-guest', async () => {
      const member = createMockMember({
        memberStatus: 'Active',
      });

      sheetsService.getSheetObjects.mockResolvedValue([member]);

      await expect(
        guestTrackingService.convertToMember(member.memberID)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getAllGuests', () => {
    it('should get all current guests', async () => {
      const guests = [
        createMockGuest(),
        createMockGuest({ memberID: 'GUEST-20250101-TEST2' }),
        createMockMember({ memberStatus: 'Active' }), // Should be excluded
      ];

      sheetsService.getSheetObjects.mockResolvedValue(guests);

      const result = await guestTrackingService.getAllGuests(false);

      expect(result).toHaveLength(2);
      expect(result.every((g) => g.memberStatus === 'Guest')).toBe(true);
    });

    it('should include converted members if requested', async () => {
      const data = [
        createMockGuest(),
        createMockGuest({ memberID: 'GUEST-20250101-TEST2', notes: 'Visit Count: 3\nConverted to member: MEM-123' }),
      ];

      sheetsService.getSheetObjects.mockResolvedValue(data);

      const result = await guestTrackingService.getAllGuests(true);

      expect(result).toHaveLength(2);
    });
  });

  describe('getGuestStats', () => {
    it('should calculate guest statistics correctly', async () => {
      const recentDate = new Date();
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40);

      const guests = [
        createMockGuest({
          notes: 'Visits: 1',
          joinDate: recentDate.toISOString().split('T')[0],
        }),
        createMockGuest({
          memberID: 'GUEST-20250101-TEST2',
          notes: 'Visits: 3',
          joinDate: recentDate.toISOString().split('T')[0],
        }),
        createMockGuest({
          memberID: 'GUEST-20250101-TEST3',
          notes: 'Visits: 1',
          joinDate: oldDate.toISOString().split('T')[0],
        }),
      ];

      sheetsService.getSheetObjects
        .mockResolvedValueOnce(guests) // getAllGuests
        .mockResolvedValueOnce([]); // Attendance data

      const result = await guestTrackingService.getGuestStats(30);

      expect(result.totalGuests).toBe(3);
      expect(result.firstTimeGuests).toBe(2);
      expect(result.returningGuests).toBe(1);
      expect(result.recentGuests).toBe(2); // Only guests from last 30 days
    });

    it('should handle guests with no visit count', async () => {
      const guests = [
        createMockGuest({ notes: '' }),
      ];

      sheetsService.getSheetObjects.mockResolvedValue(guests);

      const result = await guestTrackingService.getGuestStats();

      expect(result.totalGuests).toBe(1);
      expect(result.firstTimeGuests).toBe(1);
    });
  });
});
