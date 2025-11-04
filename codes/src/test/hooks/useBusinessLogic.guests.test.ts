import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGuests, useGuestRegistration } from '@/hooks/useBusinessLogic';
import * as businessLogicService from '@/services/businessLogicService';
import { mockGuest, mockStats, mockApiSuccess, mockApiError } from '@/test/utils';

// Mock the business logic service
vi.mock('@/services/businessLogicService', () => ({
  businessLogicAPI: {
    guest: {
      getAllGuests: vi.fn(),
      getGuestStats: vi.fn(),
      registerGuest: vi.fn(),
      convertGuestToMember: vi.fn(),
    },
  },
}));

describe('useGuests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch guests successfully', async () => {
    const mockGuestsData = [mockGuest(), mockGuest({ id: '2', firstName: 'Jane' })];
    vi.mocked(businessLogicService.businessLogicAPI.guest.getAllGuests).mockResolvedValue(
      mockGuestsData
    );

    const { result } = renderHook(() => useGuests());

    expect(result.current.loading).toBe(false);
    expect(result.current.guests).toEqual([]);

    await waitFor(() => {
      result.current.fetchGuests(false);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.guests).toEqual(mockGuestsData);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch guests error', async () => {
    const errorMessage = 'Failed to fetch guests';
    vi.mocked(businessLogicService.businessLogicAPI.guest.getAllGuests).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useGuests());

    // The hook throws the error, so we need to catch it
    try {
      await result.current.fetchGuests(false);
    } catch (error) {
      // Expected to throw
    }

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.guests).toEqual([]);
    });
  });

  it('should fetch guest statistics successfully', async () => {
    const mockStatsData = mockStats();
    vi.mocked(businessLogicService.businessLogicAPI.guest.getGuestStats).mockResolvedValue(
      mockStatsData
    );

    const { result } = renderHook(() => useGuests());

    await waitFor(() => {
      result.current.fetchStats(30);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual(mockStatsData);
    expect(result.current.error).toBeNull();
  });

  it('should filter guests by includedConverted parameter', async () => {
    const mockGuestsData = [mockGuest(), mockGuest({ id: '2', status: 'member' })];
    vi.mocked(businessLogicService.businessLogicAPI.guest.getAllGuests).mockResolvedValue(
      mockGuestsData
    );

    const { result } = renderHook(() => useGuests());

    await waitFor(() => {
      result.current.fetchGuests(false);
    });

    await waitFor(() => {
      expect(businessLogicService.businessLogicAPI.guest.getAllGuests).toHaveBeenCalledWith(false);
    });
  });
});

describe('useGuestRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a guest successfully', async () => {
    const guestData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    };

    const registeredGuest = mockGuest(guestData);
    vi.mocked(businessLogicService.businessLogicAPI.guest.registerGuest).mockResolvedValue({
      guest: registeredGuest,
      isNewGuest: true,
      visitCount: 1,
    });

    const { result } = renderHook(() => useGuestRegistration());

    expect(result.current.loading).toBe(false);

    let registrationResult: any;
    await waitFor(async () => {
      registrationResult = await result.current.registerGuest(guestData);
    });

    // The hook returns the API response directly: {guest, isNewGuest, visitCount}
    expect(registrationResult.guest).toEqual(registeredGuest);
    expect(registrationResult.isNewGuest).toBe(true);
    expect(registrationResult.visitCount).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('should handle guest registration error', async () => {
    const guestData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'invalid-email',
      phone: '+1234567890',
    };

    const errorMessage = 'Invalid email format';
    vi.mocked(businessLogicService.businessLogicAPI.guest.registerGuest).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useGuestRegistration());

    // The hook throws the error, so we need to catch it
    await expect(async () => {
      await result.current.registerGuest(guestData);
    }).rejects.toThrow(errorMessage);

    // Error should be set in hook state
    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
    });
  });

  it('should convert guest to member successfully', async () => {
    const guestId = '123';
    const conversionData = {
      membershipDate: '2024-01-01',
      branch: 'Main',
      role: 'Member',
    };

    vi.mocked(businessLogicService.businessLogicAPI.guest.convertGuestToMember).mockResolvedValue(
      mockApiSuccess({ success: true })
    );

    const { result } = renderHook(() => useGuestRegistration());

    let conversionResult: any;
    await waitFor(async () => {
      conversionResult = await result.current.convertToMember(guestId, conversionData);
    });

    expect(conversionResult.success).toBe(true);
    expect(businessLogicService.businessLogicAPI.guest.convertGuestToMember).toHaveBeenCalledWith(
      guestId,
      conversionData
    );
  });

  it('should handle convert to member error', async () => {
    const guestId = '123';
    const conversionData = {
      membershipDate: '2024-01-01',
      branch: 'Main',
      role: 'Member',
    };

    const errorMessage = 'Guest not found';
    vi.mocked(businessLogicService.businessLogicAPI.guest.convertGuestToMember).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useGuestRegistration());

    // The hook throws the error, so we need to catch it
    await expect(async () => {
      await result.current.convertToMember(guestId, conversionData);
    }).rejects.toThrow(errorMessage);

    // Error should be set in hook state
    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
    });
  });

  it('should set loading state during registration', async () => {
    const guestData = { firstName: 'John', lastName: 'Doe', phone: '+1234567890', email: 'john@example.com' };
    
    let resolveRegistration: any;
    const registrationPromise = new Promise((resolve) => {
      resolveRegistration = resolve;
    });

    vi.mocked(businessLogicService.businessLogicAPI.guest.registerGuest).mockReturnValue(
      registrationPromise as any
    );

    const { result } = renderHook(() => useGuestRegistration());

    result.current.registerGuest(guestData);

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    resolveRegistration(mockApiSuccess(mockGuest(guestData)));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
