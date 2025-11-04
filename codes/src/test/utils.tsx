import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';

// Custom render function that includes common providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
}

export function renderWithRouter(
  ui: ReactElement,
  { initialRoute = '/', ...options }: CustomRenderOptions = {}
) {
  window.history.pushState({}, 'Test page', initialRoute);

  return render(ui, {
    wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    ...options,
  });
}

// Mock data generators
export const mockGuest = (overrides = {}) => ({
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phoneNumber: '+1234567890',
  visitCount: 1,
  firstVisitDate: '2024-01-01',
  lastVisitDate: '2024-01-01',
  invitedBy: 'Jane Smith',
  status: 'guest',
  notes: '',
  ...overrides,
});

export const mockMember = (overrides = {}) => ({
  id: '1',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@example.com',
  phoneNumber: '+1234567891',
  membershipDate: '2023-01-01',
  branch: 'Main',
  role: 'Member',
  ...overrides,
});

export const mockCheckIn = (overrides = {}) => ({
  id: '1',
  memberId: '1',
  checkInTime: new Date().toISOString(),
  checkOutTime: null,
  eventId: null,
  notes: '',
  ...overrides,
});

export const mockDonation = (overrides = {}) => ({
  id: '1',
  memberId: '1',
  memberName: 'Jane Smith',
  amount: 100,
  donationType: 'tithe',
  paymentMethod: 'bank_transfer',
  reference: 'REF123',
  date: '2024-01-01',
  verificationStatus: 'pending',
  verifiedBy: null,
  verifiedAt: null,
  notes: '',
  ...overrides,
});

export const mockStats = (overrides = {}) => ({
  totalGuests: 50,
  newGuests: 10,
  returningGuests: 40,
  conversionRate: 20,
  returnVisits: 30,
  averageVisits: 2.5,
  ...overrides,
});

export const mockDonationStats = (overrides = {}) => ({
  verifiedCount: 45,
  totalAmount: 5000,
  averageAmount: 111.11,
  verificationRate: 90,
  ...overrides,
});

// Mock API responses
export const mockApiSuccess = (data: any) => ({
  success: true,
  data,
  message: 'Operation successful',
});

export const mockApiError = (message = 'Operation failed') => ({
  success: false,
  error: message,
  message,
});

// Wait utilities
export const waitForLoadingToFinish = async () => {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    const loadingElement = document.querySelector('[data-testid="loading"]');
    return loadingElement === null;
  });
};

// User event utilities
export { default as userEvent } from '@testing-library/user-event';
