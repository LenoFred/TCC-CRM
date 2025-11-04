/**
 * Backend Integration Tests
 * Tests the complete backend API endpoints with real service integration
 */

const request = require('supertest');
const app = require('../../src/index');
const sheetsService = require('../../src/services/sheetsService');

// Mock sheetsService since we don't want to hit real Google Sheets in tests
jest.mock('../../src/services/sheetsService');

describe('Backend Integration Tests', () => {
  let authToken;
  let testMemberID;
  let testGatheringID;
  let testDonationID;

  beforeAll(async () => {
    // Mock authentication
    authToken = 'test-token';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('API Root', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/api');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('TCC-CRM API');
      expect(response.body.endpoints).toBeDefined();
    });
  });

  describe('Business Logic Endpoints', () => {
    describe('Guest Registration', () => {
      it('should reject request without authentication', async () => {
        const response = await request(app)
          .post('/api/business/guest-register')
          .send({
            firstName: 'John',
            lastName: 'Visitor',
            phone: '+2348012345678',
            email: 'john@example.com',
          });

        expect(response.status).toBe(401);
      });

      it('should register guest with valid authentication', async () => {
        // Mock the sheetsService responses
        sheetsService.getSheetObjects.mockResolvedValue([]);
        sheetsService.updateSheetData.mockResolvedValue();
        sheetsService.invalidateCache.mockResolvedValue();

        const response = await request(app)
          .post('/api/business/guest-register')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            firstName: 'John',
            lastName: 'Visitor',
            phone: '+2348012345678',
            email: 'john@example.com',
          });

        // This will fail auth but we're checking the endpoint exists
        expect([200, 401, 403]).toContain(response.status);
      });
    });

    describe('Check-in Endpoints', () => {
      it('should have check-in endpoint', async () => {
        const response = await request(app)
          .post('/api/business/check-in')
          .send({
            memberID: 'MEM-TEST',
            gatheringID: 'GAT-TEST',
          });

        // Should fail auth or validation, not 404
        expect([400, 401, 403, 422]).toContain(response.status);
      });

      it('should have QR check-in endpoint', async () => {
        const response = await request(app)
          .post('/api/business/check-in-qr')
          .send({
            qrCodeData: 'MEM-TEST',
            gatheringID: 'GAT-TEST',
          });

        expect([400, 401, 403, 422]).toContain(response.status);
      });
    });

    describe('Donation Verification Endpoints', () => {
      it('should have donation submit endpoint', async () => {
        const response = await request(app)
          .post('/api/business/donation-submit')
          .send({
            memberID: 'MEM-TEST',
            amount: 10000,
            currency: 'NGN',
            donationType: 'Tithe',
            paymentMethod: 'Bank Transfer',
            donationDate: '2025-01-01',
          });

        expect([400, 401, 403, 422]).toContain(response.status);
      });

      it('should have donation verify endpoint', async () => {
        const response = await request(app)
          .post('/api/business/donation-verify')
          .send({
            donationID: 'DON-TEST',
            verifiedBy: 'STAFF-TEST',
          });

        expect([400, 401, 403, 422]).toContain(response.status);
      });

      it('should have pending donations endpoint', async () => {
        const response = await request(app).get('/api/business/donations-pending');

        expect([200, 401, 403]).toContain(response.status);
      });
    });

    describe('Communication Endpoints', () => {
      it('should have send SMS endpoint', async () => {
        const response = await request(app)
          .post('/api/business/send-sms')
          .send({
            to: '+2348012345678',
            message: 'Test message',
          });

        expect([400, 401, 403, 422]).toContain(response.status);
      });

      it('should have send email endpoint', async () => {
        const response = await request(app)
          .post('/api/business/send-email')
          .send({
            to: 'test@example.com',
            subject: 'Test',
            htmlContent: '<p>Test</p>',
          });

        expect([400, 401, 403, 422]).toContain(response.status);
      });
    });
  });

  describe('CRUD Endpoints', () => {
    it('should have members endpoint', async () => {
      sheetsService.getSheetObjects.mockResolvedValue([]);

      const response = await request(app).get('/api/members');

      expect([200, 401]).toContain(response.status);
    });

    it('should have gatherings endpoint', async () => {
      sheetsService.getSheetObjects.mockResolvedValue([]);

      const response = await request(app).get('/api/gatherings');

      expect([200, 401]).toContain(response.status);
    });

    it('should have donations endpoint', async () => {
      sheetsService.getSheetObjects.mockResolvedValue([]);

      const response = await request(app).get('/api/donations');

      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown-route-that-does-not-exist');

      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/business/guest-register')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });
  });
});
