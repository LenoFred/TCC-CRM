import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '@/components/Dashboard';
import * as useBusinessLogic from '@/hooks/useBusinessLogic';
import { mockGuest, mockStats, mockDonation, mockDonationStats } from '@/test/utils';

// Mock the hooks
vi.mock('@/hooks/useBusinessLogic', () => ({
  useGuests: vi.fn(),
  useDonationVerification: vi.fn(),
}));

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    vi.mocked(useBusinessLogic.useGuests).mockReturnValue({
      guests: [],
      stats: null,
      loading: true,
      error: null,
      fetchGuests: vi.fn(),
      fetchStats: vi.fn(),
    });

    vi.mocked(useBusinessLogic.useDonationVerification).mockReturnValue({
      pendingDonations: [],
      stats: null,
      loading: true,
      error: null,
      submitDonation: vi.fn(),
      verifyDonation: vi.fn(),
      rejectDonation: vi.fn(),
      bulkVerify: vi.fn(),
      fetchPendingDonations: vi.fn(),
      fetchStats: vi.fn(),
      getReceipt: vi.fn(),
    });

    renderDashboard();

    // Check for loading skeletons
    const loadingElements = document.querySelectorAll('[data-testid="loading"], .animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should display guest statistics when data is loaded', async () => {
    const mockStatsData = mockStats({
      totalGuests: 100,
      newGuests: 25,
      returningGuests: 75,
      conversionRate: 30,
    });

    vi.mocked(useBusinessLogic.useGuests).mockReturnValue({
      guests: [mockGuest()],
      stats: mockStatsData,
      loading: false,
      error: null,
      fetchGuests: vi.fn(),
      fetchStats: vi.fn(),
    });

    vi.mocked(useBusinessLogic.useDonationVerification).mockReturnValue({
      pendingDonations: [],
      stats: mockDonationStats(),
      loading: false,
      error: null,
      submitDonation: vi.fn(),
      verifyDonation: vi.fn(),
      rejectDonation: vi.fn(),
      bulkVerify: vi.fn(),
      fetchPendingDonations: vi.fn(),
      fetchStats: vi.fn(),
      getReceipt: vi.fn(),
    });

    renderDashboard();

    await waitFor(() => {
      // Use getAllByText since numbers appear in multiple places (metric cards and badges)
      expect(screen.getAllByText('100').length).toBeGreaterThan(0); // Total Guests
      expect(screen.getAllByText('25').length).toBeGreaterThan(0); // New Guests also appears in multiple places
      expect(screen.getAllByText('30%').length).toBeGreaterThan(0); // Conversion Rate also appears in multiple places
    });
  });

  it('should display pending donations count', async () => {
    const pendingDonationsList = [
      mockDonation({ id: '1' }),
      mockDonation({ id: '2' }),
      mockDonation({ id: '3' }),
    ];

    vi.mocked(useBusinessLogic.useGuests).mockReturnValue({
      guests: [],
      stats: mockStats(),
      loading: false,
      error: null,
      fetchGuests: vi.fn(),
      fetchStats: vi.fn(),
    });

    vi.mocked(useBusinessLogic.useDonationVerification).mockReturnValue({
      pendingDonations: pendingDonationsList,
      stats: mockDonationStats(),
      loading: false,
      error: null,
      submitDonation: vi.fn(),
      verifyDonation: vi.fn(),
      rejectDonation: vi.fn(),
      bulkVerify: vi.fn(),
      fetchPendingDonations: vi.fn(),
      fetchStats: vi.fn(),
      getReceipt: vi.fn(),
    });

    renderDashboard();

    await waitFor(() => {
      // Should show 3 pending donations - use getAllByText since the number appears in multiple places
      const pendingTexts = screen.getAllByText('3');
      expect(pendingTexts.length).toBeGreaterThan(0);
    });
  });

  it('should display error message when fetch fails', async () => {
    const errorMessage = 'Failed to fetch dashboard data';

    vi.mocked(useBusinessLogic.useGuests).mockReturnValue({
      guests: [],
      stats: null,
      loading: false,
      error: errorMessage,
      fetchGuests: vi.fn(),
      fetchStats: vi.fn(),
    });

    vi.mocked(useBusinessLogic.useDonationVerification).mockReturnValue({
      pendingDonations: [],
      stats: null,
      loading: false,
      error: null,
      submitDonation: vi.fn(),
      verifyDonation: vi.fn(),
      rejectDonation: vi.fn(),
      bulkVerify: vi.fn(),
      fetchPendingDonations: vi.fn(),
      fetchStats: vi.fn(),
      getReceipt: vi.fn(),
    });

    renderDashboard();

    await waitFor(() => {
      // The error message appears in both the alert title and content
      const errorElements = screen.getAllByText(errorMessage);
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  it('should call fetch functions on mount', async () => {
    const fetchGuestsMock = vi.fn();
    const fetchStatsMock = vi.fn();
    const fetchPendingDonationsMock = vi.fn();
    const fetchDonationStatsMock = vi.fn();

    vi.mocked(useBusinessLogic.useGuests).mockReturnValue({
      guests: [],
      stats: null,
      loading: false,
      error: null,
      fetchGuests: fetchGuestsMock,
      fetchStats: fetchStatsMock,
    });

    vi.mocked(useBusinessLogic.useDonationVerification).mockReturnValue({
      pendingDonations: [],
      stats: null,
      loading: false,
      error: null,
      submitDonation: vi.fn(),
      verifyDonation: vi.fn(),
      rejectDonation: vi.fn(),
      bulkVerify: vi.fn(),
      fetchPendingDonations: fetchPendingDonationsMock,
      fetchStats: fetchDonationStatsMock,
      getReceipt: vi.fn(),
    });

    renderDashboard();

    // Dashboard should call fetch functions on mount - wait for useEffect to run
    await waitFor(() => {
      expect(fetchGuestsMock).toHaveBeenCalledWith(false);
      expect(fetchStatsMock).toHaveBeenCalledWith(30);
      expect(fetchPendingDonationsMock).toHaveBeenCalled();
      expect(fetchDonationStatsMock).toHaveBeenCalled();
    });
  });

  it('should display donation verification statistics', async () => {
    const mockDonationStatsData = mockDonationStats({
      verifiedCount: 50,
      totalAmount: 10000,
      averageAmount: 200,
      verificationRate: 95,
    });

    vi.mocked(useBusinessLogic.useGuests).mockReturnValue({
      guests: [],
      stats: mockStats(),
      loading: false,
      error: null,
      fetchGuests: vi.fn(),
      fetchStats: vi.fn(),
    });

    vi.mocked(useBusinessLogic.useDonationVerification).mockReturnValue({
      pendingDonations: [],
      stats: mockDonationStatsData,
      loading: false,
      error: null,
      submitDonation: vi.fn(),
      verifyDonation: vi.fn(),
      rejectDonation: vi.fn(),
      bulkVerify: vi.fn(),
      fetchPendingDonations: vi.fn(),
      fetchStats: vi.fn(),
      getReceipt: vi.fn(),
    });

    renderDashboard();

    await waitFor(() => {
      // Use getAllByText since numbers appear in multiple places (cards, badges, etc.)
      expect(screen.getAllByText('50').length).toBeGreaterThan(0); // Verified count appears multiple times
      expect(screen.getByText('$10,000')).toBeInTheDocument(); // Total amount
      expect(screen.getByText('95%')).toBeInTheDocument(); // Verification rate
    });
  });

  it('should display welcome message with user info', () => {
    vi.mocked(useBusinessLogic.useGuests).mockReturnValue({
      guests: [],
      stats: mockStats(),
      loading: false,
      error: null,
      fetchGuests: vi.fn(),
      fetchStats: vi.fn(),
    });

    vi.mocked(useBusinessLogic.useDonationVerification).mockReturnValue({
      pendingDonations: [],
      stats: mockDonationStats(),
      loading: false,
      error: null,
      submitDonation: vi.fn(),
      verifyDonation: vi.fn(),
      rejectDonation: vi.fn(),
      bulkVerify: vi.fn(),
      fetchPendingDonations: vi.fn(),
      fetchStats: vi.fn(),
      getReceipt: vi.fn(),
    });

    renderDashboard();

    // Check for welcome message
    expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
  });

  it('should display quick actions section', () => {
    vi.mocked(useBusinessLogic.useGuests).mockReturnValue({
      guests: [],
      stats: mockStats(),
      loading: false,
      error: null,
      fetchGuests: vi.fn(),
      fetchStats: vi.fn(),
    });

    vi.mocked(useBusinessLogic.useDonationVerification).mockReturnValue({
      pendingDonations: [],
      stats: mockDonationStats(),
      loading: false,
      error: null,
      submitDonation: vi.fn(),
      verifyDonation: vi.fn(),
      rejectDonation: vi.fn(),
      bulkVerify: vi.fn(),
      fetchPendingDonations: vi.fn(),
      fetchStats: vi.fn(),
      getReceipt: vi.fn(),
    });

    renderDashboard();

    // Quick actions should be present
    expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
  });
});


