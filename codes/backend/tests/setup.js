/**
 * Test Setup
 * Global test configuration and mocks
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.GOOGLE_SHEET_ID = 'test-sheet-id';
process.env.PORT = '3002';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test helpers
global.createMockMember = (overrides = {}) => ({
  memberID: 'MEM-20250101-TEST1',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: '+2348012345678',
  memberStatus: 'Active',
  dateJoined: '2025-01-01',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

global.createMockGuest = (overrides = {}) => ({
  memberID: 'GUEST-20250101-TEST1',
  firstName: 'Guest',
  lastName: 'Visitor',
  email: 'guest@example.com',
  phone: '+2348087654321',
  memberStatus: 'Guest',
  dateJoined: '2025-01-01',
  notes: 'Visit Count: 1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

global.createMockGathering = (overrides = {}) => ({
  gatheringID: 'GAT-20250101-TEST1',
  gatheringName: 'Sunday Service',
  gatheringDate: '2025-01-01',
  gatheringTime: '10:00',
  expectedAttendance: 100,
  actualAttendance: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

global.createMockDonation = (overrides = {}) => ({
  donationID: 'DON-20250101-TEST1',
  memberID: 'MEM-20250101-TEST1',
  amount: 10000,
  currency: 'NGN',
  donationType: 'Tithe',
  paymentMethod: 'Bank Transfer',
  status: 'Pending',
  donationDate: '2025-01-01',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

global.createMockStaff = (overrides = {}) => ({
  staffID: 'STAFF-20250101-TEST1',
  firstName: 'Staff',
  lastName: 'Member',
  email: 'staff@example.com',
  phone: '+2348011111111',
  role: 'Staff',
  department: 'Administration',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

global.createMockAttendance = (overrides = {}) => ({
  attendanceID: 'ATT-20250101-TEST1',
  memberID: 'MEM-20250101-TEST1',
  gatheringID: 'GAT-20250101-TEST1',
  checkInTime: new Date().toISOString(),
  checkOutTime: '',
  checkInMethod: 'Manual',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Clean up after all tests
afterAll(() => {
  jest.clearAllMocks();
});
