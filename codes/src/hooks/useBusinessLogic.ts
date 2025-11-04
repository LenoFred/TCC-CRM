/**
 * Business Logic Hooks
 * Custom React hooks for business logic operations
 */

import { useState, useCallback } from 'react';
import { businessLogicAPI } from '../services/businessLogicService';
import type { GuestData, CheckInData, DonationData, CommunicationData } from '../services/businessLogicService';

// ==========================================
// Guest Tracking Hooks
// ==========================================

export const useGuestRegistration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const registerGuest = useCallback(async (guestData: GuestData, gatheringID?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.guest.registerGuest(guestData, gatheringID);
      setData(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to register guest';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const convertToMember = useCallback(async (guestID: string, additionalInfo?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.guest.convertGuestToMember(guestID, additionalInfo);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to convert guest';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { registerGuest, convertToMember, loading, error, data };
};

export const useGuests = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const fetchGuests = useCallback(async (includeMembers: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.guest.getAllGuests(includeMembers);
      setGuests(response || []);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch guests';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (days: number = 30) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.guest.getGuestStats(days);
      setStats(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch stats';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchGuests, fetchStats, guests, stats, loading, error };
};

// ==========================================
// Check-in Hooks
// ==========================================

export const useCheckIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAttendees, setCurrentAttendees] = useState<any[]>([]);

  const checkIn = useCallback(async (data: CheckInData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.checkIn.checkIn(data);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Check-in failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkOut = useCallback(async (memberID: string, gatheringID: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.checkIn.checkOut(memberID, gatheringID);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Check-out failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkCheckIn = useCallback(async (memberIDs: string[], gatheringID: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.checkIn.bulkCheckIn(memberIDs, gatheringID);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Bulk check-in failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkInViaQR = useCallback(async (qrCodeData: string, gatheringID: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.checkIn.checkInViaQR(qrCodeData, gatheringID);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'QR check-in failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCurrentAttendees = useCallback(async (gatheringID: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.checkIn.getCurrentAttendees(gatheringID);
      setCurrentAttendees(response || []);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch attendees';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAttendanceReport = useCallback(async (gatheringID: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.checkIn.getAttendanceReport(gatheringID);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch report';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    checkIn,
    checkOut,
    bulkCheckIn,
    checkInViaQR,
    fetchCurrentAttendees,
    fetchAttendanceReport,
    currentAttendees,
    loading,
    error,
  };
};

// ==========================================
// Donation Verification Hooks
// ==========================================

export const useDonationVerification = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDonations, setPendingDonations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const submitDonation = useCallback(async (data: DonationData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.donation.submitDonation(data);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Submission failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyDonation = useCallback(async (donationID: string, verifiedBy: string, notes?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.donation.verifyDonation(donationID, verifiedBy, notes);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Verification failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectDonation = useCallback(async (donationID: string, rejectedBy: string, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.donation.rejectDonation(donationID, rejectedBy, reason);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Rejection failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkVerify = useCallback(async (donationIDs: string[], verifiedBy: string, notes?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.donation.bulkVerify(donationIDs, verifiedBy, notes);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Bulk verification failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingDonations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.donation.getPendingDonations();
      setPendingDonations(response || []);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch pending';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.donation.getVerificationStats();
      console.log('=== DONATION STATS RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response data:', response?.data);
      console.log('verifiedCount:', response?.verifiedCount || response?.data?.verifiedCount);
      console.log('totalAmount:', response?.totalAmount || response?.data?.totalAmount);
      console.log('averageAmount:', response?.averageAmount || response?.data?.averageAmount);
      // Unwrap the data property since API returns { success: true, data: {...} }
      const unwrappedData = response?.data || response;
      setStats(unwrappedData);
      return unwrappedData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch stats';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getReceipt = useCallback(async (donationID: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.donation.getReceipt(donationID);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to get receipt';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    submitDonation,
    verifyDonation,
    rejectDonation,
    bulkVerify,
    fetchPendingDonations,
    fetchStats,
    getReceipt,
    pendingDonations,
    stats,
    loading,
    error,
  };
};

// ==========================================
// Communication Hooks
// ==========================================

export const useCommunication = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendSMS = useCallback(async (data: CommunicationData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.communication.sendSMS(data);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'SMS send failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendEmail = useCallback(async (to: string, subject: string, htmlContent: string, recipientID?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.communication.sendEmail(to, subject, htmlContent, recipientID);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Email send failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendWhatsApp = useCallback(async (data: CommunicationData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessLogicAPI.communication.sendWhatsApp(data);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'WhatsApp send failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendBulk = useCallback(
    async (recipients: any[], messageType: 'sms' | 'email' | 'whatsapp', message: string, subject?: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await businessLogicAPI.communication.sendBulk(recipients, messageType, message, subject);
        return response;
      } catch (err: any) {
        const errorMessage = err.response?.data?.error?.message || err.message || 'Bulk send failed';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const sendTemplate = useCallback(
    async (templateName: string, recipient: any, data: any, messageType: 'sms' | 'email' = 'email') => {
      setLoading(true);
      setError(null);
      try {
        const response = await businessLogicAPI.communication.sendTemplate(templateName, recipient, data, messageType);
        return response;
      } catch (err: any) {
        const errorMessage = err.response?.data?.error?.message || err.message || 'Template send failed';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { sendSMS, sendEmail, sendWhatsApp, sendBulk, sendTemplate, loading, error };
};
