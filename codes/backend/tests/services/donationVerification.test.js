/**
 * Donation Verification Service Tests
 */

const donationVerificationService = require('../../src/services/donationVerificationService');
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

describe('Donation Verification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitDonation', () => {
    it('should submit donation with Pending status', async () => {
      const donationData = {
        memberID: 'MEM-20250101-TEST1',
        amount: 10000,
        currency: 'NGN',
        donationType: 'Tithe',
        paymentMethod: 'Bank Transfer',
        donationDate: '2025-01-01',
      };

      const member = createMockMember({ memberID: donationData.memberID });

      sheetsService.getSheetObjects
        .mockResolvedValueOnce([member]) // Members
        .mockResolvedValueOnce([]); // Donations

      sheetsService.updateSheetData.mockResolvedValue();
      sheetsService.invalidateCache.mockResolvedValue();

      const result = await donationVerificationService.submitDonation(donationData);

      expect(result.status).toBe('Pending');
      expect(parseFloat(result.amount)).toBe(10000);
      expect(result.memberID).toBe(donationData.memberID);
      expect(sheetsService.updateSheetData).toHaveBeenCalled();
    });

    it('should allow anonymous donations', async () => {
      const donationData = {
        memberID: 'Anonymous',
        amount: 5000,
        currency: 'NGN',
        donationType: 'Offering',
        paymentMethod: 'Cash',
        donationDate: '2025-01-01',
      };

      sheetsService.getSheetObjects.mockResolvedValue([]);
      sheetsService.updateSheetData.mockResolvedValue();
      sheetsService.invalidateCache.mockResolvedValue();

      const result = await donationVerificationService.submitDonation(donationData);

      expect(result.memberID).toBe('Anonymous');
      expect(result.status).toBe('Pending');
    });

    it('should throw error if member not found', async () => {
      const donationData = {
        memberID: 'MEM-NOTFOUND',
        amount: 10000,
        currency: 'NGN',
        donationType: 'Tithe',
        paymentMethod: 'Bank Transfer',
        donationDate: '2025-01-01',
      };

      sheetsService.getSheetObjects.mockResolvedValue([]);

      await expect(
        donationVerificationService.submitDonation(donationData)
      ).rejects.toThrow('Member not found');
    });

    it('should throw error if required fields missing', async () => {
      const invalidData = {
        memberID: 'MEM-20250101-TEST1',
        // Missing amount, currency, etc.
      };

      await expect(
        donationVerificationService.submitDonation(invalidData)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('verifyDonation', () => {
    it('should verify donation successfully', async () => {
      const donation = createMockDonation({ status: 'Pending' });
      const staff = createMockStaff();

      sheetsService.getSheetObjects
        .mockResolvedValueOnce([staff]) // Staff
        .mockResolvedValueOnce([donation]); // Donations

      sheetsService.updateSheetData.mockResolvedValue();
      sheetsService.invalidateCache.mockResolvedValue();

      const result = await donationVerificationService.verifyDonation(
        donation.donationID,
        staff.staffID,
        { notes: 'Verified bank transfer' }
      );

      expect(result.status).toBe('Verified');
      expect(result.verifiedBy).toBe(staff.staffID);
      expect(result.updatedAt).toBeDefined();
      expect(result.notes).toContain('Verified bank transfer');
    });

    it('should throw error if staff not found', async () => {
      sheetsService.getSheetObjects.mockResolvedValue([]);

      await expect(
        donationVerificationService.verifyDonation(
          'DON-20250101-TEST1',
          'STAFF-NOTFOUND'
        )
      ).rejects.toThrow('Verifier not found');
    });

    it('should throw error if donation not found', async () => {
      const staff = createMockStaff();

      sheetsService.getSheetObjects
        .mockResolvedValueOnce([staff])
        .mockResolvedValueOnce([]);

      await expect(
        donationVerificationService.verifyDonation(
          'DON-NOTFOUND',
          staff.staffID
        )
      ).rejects.toThrow('Donation not found');
    });

    it('should throw error if already verified', async () => {
      const donation = createMockDonation({ status: 'Verified' });
      const staff = createMockStaff();

      sheetsService.getSheetObjects
        .mockResolvedValueOnce([staff])
        .mockResolvedValueOnce([donation]);

      await expect(
        donationVerificationService.verifyDonation(
          donation.donationID,
          staff.staffID
        )
      ).rejects.toThrow('Donation already verified');
    });
  });

  describe('rejectDonation', () => {
    it('should reject donation with reason', async () => {
      const donation = createMockDonation({ status: 'Pending' });
      const staff = createMockStaff();

      sheetsService.getSheetObjects.mockResolvedValueOnce([donation]); // rejectDonation gets donations

      sheetsService.updateSheetData.mockResolvedValue();
      sheetsService.invalidateCache.mockResolvedValue();

      const result = await donationVerificationService.rejectDonation(
        donation.donationID,
        staff.staffID,
        'Duplicate donation'
      );

      expect(result.status).toBe('Rejected');
      expect(result.notes).toContain('Duplicate donation');
      expect(result.notes).toContain('Rejection');
    });

    it('should throw error if reason not provided', async () => {
      const staff = createMockStaff();
      const donation = createMockDonation();

      sheetsService.getSheetObjects
        .mockResolvedValueOnce([staff])
        .mockResolvedValueOnce([donation]);

      await expect(
        donationVerificationService.rejectDonation(
          donation.donationID,
          staff.staffID,
          ''
        )
      ).rejects.toThrow('Rejection reason is required');
    });
  });

  describe('bulkVerify', () => {
    it('should verify multiple donations', async () => {
      const staff = createMockStaff();
      const donations = [
        createMockDonation({ donationID: 'DON-1', status: 'Pending' }),
        createMockDonation({ donationID: 'DON-2', status: 'Pending' }),
      ];

      // Each verifyDonation call needs: staff, then donations
      sheetsService.getSheetObjects
        .mockResolvedValueOnce([staff]) // First verify - staff
        .mockResolvedValueOnce(donations) // First verify - donations
        .mockResolvedValueOnce([staff]) // Second verify - staff
        .mockResolvedValueOnce(donations); // Second verify - donations

      sheetsService.updateSheetData.mockResolvedValue();
      sheetsService.invalidateCache.mockResolvedValue();

      const result = await donationVerificationService.bulkVerify(
        ['DON-1', 'DON-2'],
        staff.staffID
      );

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle partial failures', async () => {
      const staff = createMockStaff();
      const donations = [
        createMockDonation({ donationID: 'DON-1', status: 'Pending' }),
      ];

      sheetsService.getSheetObjects
        .mockResolvedValueOnce([staff])
        .mockResolvedValueOnce(donations);

      sheetsService.updateSheetData.mockResolvedValue();
      sheetsService.invalidateCache.mockResolvedValue();

      const result = await donationVerificationService.bulkVerify(
        ['DON-1', 'DON-NOTFOUND'],
        staff.staffID
      );

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
    });
  });

  describe('getPendingDonations', () => {
    it('should get all pending donations', async () => {
      const donations = [
        createMockDonation({ status: 'Pending' }),
        createMockDonation({ donationID: 'DON-2', status: 'Verified' }),
        createMockDonation({ donationID: 'DON-3', status: 'Pending' }),
      ];

      sheetsService.getSheetObjects.mockResolvedValue(donations);

      const result = await donationVerificationService.getPendingDonations();

      expect(result).toHaveLength(2);
      expect(result.every((d) => d.status === 'Pending')).toBe(true);
    });
  });

  describe('generateReceipt', () => {
    it('should generate receipt for verified donation', async () => {
      const member = createMockMember();
      const donation = createMockDonation({
        memberID: member.memberID,
        status: 'Verified',
        verifiedBy: 'STAFF-20250101-TEST1',
        verifiedAt: '2025-01-01T12:00:00Z',
      });

      sheetsService.getSheetObjects
        .mockResolvedValueOnce([donation])
        .mockResolvedValueOnce([member]);

      const result = await donationVerificationService.generateReceipt(
        donation.donationID
      );

      expect(result.receiptNumber).toContain('RCPT-');
      expect(result.amount).toBe(donation.amount);
      expect(result.donor.name).toBeDefined();
      expect(result.churchInfo).toBeDefined();
      expect(result.verifiedBy).toBeDefined();
    });

    it('should throw error if donation not verified', async () => {
      const donation = createMockDonation({ status: 'Pending' });

      sheetsService.getSheetObjects.mockResolvedValue([donation]);

      await expect(
        donationVerificationService.generateReceipt(donation.donationID)
      ).rejects.toThrow('Only verified donations can have receipts');
    });

    it('should handle anonymous donations', async () => {
      const donation = createMockDonation({
        memberID: 'Anonymous',
        status: 'Verified',
      });

      sheetsService.getSheetObjects.mockResolvedValue([donation]);

      const result = await donationVerificationService.generateReceipt(
        donation.donationID
      );

      expect(result.donor.name).toBe('Anonymous Donor');
    });
  });

  describe('getVerificationStats', () => {
    it('should calculate verification statistics', async () => {
      const donations = [
        createMockDonation({ status: 'Verified', amount: 10000, verifiedBy: 'STAFF-1' }),
        createMockDonation({ donationID: 'DON-2', status: 'Pending', amount: 5000 }),
        createMockDonation({ donationID: 'DON-3', status: 'Rejected', amount: 3000 }),
        createMockDonation({ donationID: 'DON-4', status: 'Verified', amount: 7000, verifiedBy: 'STAFF-1' }),
      ];

      sheetsService.getSheetObjects.mockResolvedValue(donations);

      const result = await donationVerificationService.getVerificationStats();

      expect(result.totals.total).toBe(4);
      expect(result.totals.verified).toBe(2);
      expect(result.totals.pending).toBe(1);
      expect(result.totals.rejected).toBe(1);
      expect(result.verificationRate).toBe(50);
      expect(result.amounts.verifiedAmount).toBe(17000);
      expect(result.verifierWorkload['STAFF-1']).toBe(2);
    });

    it('should handle empty donations list', async () => {
      sheetsService.getSheetObjects.mockResolvedValue([]);

      const result = await donationVerificationService.getVerificationStats();

      expect(result.totals.total).toBe(0);
      expect(result.verificationRate).toBe(0);
    });
  });
});
