/**
 * Business Logic API Service
 * Service layer for business logic endpoints (guest tracking, check-in, donations, communications)
 */

import { apiRequest } from '../config/api';

// ==========================================
// Types
// ==========================================

export interface GuestData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address?: string;
  invitedBy?: string;
  interests?: string;
  notes?: string;
}

export interface GuestRegistrationResponse {
  guest: any;
  isNewGuest: boolean;
  visitCount: number;
  attendance?: any;
}

export interface CheckInData {
  memberID: string;
  gatheringID: string;
  checkInMethod?: 'Manual' | 'QR Code' | 'Bulk';
}

export interface DonationData {
  memberID: string;
  amount: number;
  currency: string;
  donationType: string;
  paymentMethod: string;
  donationDate: string;
  notes?: string;
}

export interface CommunicationData {
  to: string;
  message: string;
  recipientID?: string;
  subject?: string;
}

// ==========================================
// Guest Tracking Service
// ==========================================

export const guestService = {
  /**
   * Register a new guest or record a visit for existing guest
   */
  async registerGuest(data: GuestData, gatheringID?: string): Promise<GuestRegistrationResponse> {
    return apiRequest('/business/guest-register', {
      method: 'POST',
      body: JSON.stringify({ ...data, gatheringID }),
    });
  },

  /**
   * Convert a guest to a full member
   */
  async convertGuestToMember(guestID: string, additionalInfo?: any): Promise<any> {
    return apiRequest('/business/guest-to-member', {
      method: 'POST',
      body: JSON.stringify({ guestID, additionalInfo }),
    });
  },

  /**
   * Get all guests
   */
  async getAllGuests(includeMembers: boolean = false): Promise<any[]> {
    const query = includeMembers ? '?includeMembers=true' : '';
    return apiRequest(`/business/guests${query}`, {
      method: 'GET',
    });
  },

  /**
   * Get guest statistics
   */
  async getGuestStats(days: number = 30): Promise<any> {
    return apiRequest(`/business/guest-stats?days=${days}`, {
      method: 'GET',
    });
  },
};

// ==========================================
// Check-in Service
// ==========================================

export const checkInService = {
  /**
   * Check in a member to a gathering
   */
  async checkIn(data: CheckInData): Promise<any> {
    return apiRequest('/business/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Check out a member from a gathering
   */
  async checkOut(memberID: string, gatheringID: string): Promise<any> {
    return apiRequest('/business/check-out', {
      method: 'POST',
      body: JSON.stringify({ memberID, gatheringID }),
    });
  },

  /**
   * Bulk check-in multiple members
   */
  async bulkCheckIn(memberIDs: string[], gatheringID: string, checkInMethod: string = 'Bulk'): Promise<any> {
    return apiRequest('/business/bulk-check-in', {
      method: 'POST',
      body: JSON.stringify({ memberIDs, gatheringID, checkInMethod }),
    });
  },

  /**
   * Check in via QR code
   */
  async checkInViaQR(qrCodeData: string, gatheringID: string): Promise<any> {
    return apiRequest('/business/check-in-qr', {
      method: 'POST',
      body: JSON.stringify({ qrCodeData, gatheringID }),
    });
  },

  /**
   * Get currently checked-in attendees
   */
  async getCurrentAttendees(gatheringID: string): Promise<any[]> {
    return apiRequest(`/business/current-attendees/${gatheringID}`, {
      method: 'GET',
    });
  },

  /**
   * Get comprehensive attendance report
   */
  async getAttendanceReport(gatheringID: string): Promise<any> {
    return apiRequest(`/business/attendance-report/${gatheringID}`, {
      method: 'GET',
    });
  },

  /**
   * Generate QR code for a member
   */
  async getMemberQR(memberID: string): Promise<any> {
    return apiRequest(`/business/member-qr/${memberID}`, {
      method: 'GET',
    });
  },
};

// ==========================================
// Donation Verification Service
// ==========================================

export const donationService = {
  /**
   * Submit a donation for verification
   */
  async submitDonation(data: DonationData): Promise<any> {
    return apiRequest('/business/donation-submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Verify a donation (staff only)
   */
  async verifyDonation(donationID: string, verifiedBy: string, notes?: string): Promise<any> {
    return apiRequest('/business/donation-verify', {
      method: 'POST',
      body: JSON.stringify({ donationID, verifiedBy, notes }),
    });
  },

  /**
   * Reject a donation (staff only)
   */
  async rejectDonation(donationID: string, rejectedBy: string, reason: string): Promise<any> {
    return apiRequest('/business/donation-reject', {
      method: 'POST',
      body: JSON.stringify({ donationID, rejectedBy, reason }),
    });
  },

  /**
   * Bulk verify multiple donations (admin only)
   */
  async bulkVerify(donationIDs: string[], verifiedBy: string, notes?: string): Promise<any> {
    return apiRequest('/business/donation-bulk-verify', {
      method: 'POST',
      body: JSON.stringify({ donationIDs, verifiedBy, notes }),
    });
  },

  /**
   * Get all pending donations
   */
  async getPendingDonations(): Promise<any[]> {
    return apiRequest('/business/donations-pending', {
      method: 'GET',
    });
  },

  /**
   * Generate receipt for a verified donation
   */
  async getReceipt(donationID: string): Promise<any> {
    return apiRequest(`/business/donation-receipt/${donationID}`, {
      method: 'GET',
    });
  },

  /**
   * Get verification statistics
   */
  async getVerificationStats(): Promise<any> {
    return apiRequest('/business/donation-stats', {
      method: 'GET',
    });
  },
};

// ==========================================
// Communication Service
// ==========================================

export const communicationService = {
  /**
   * Send SMS to a recipient
   */
  async sendSMS(data: CommunicationData): Promise<any> {
    return apiRequest('/business/send-sms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Send email to a recipient
   */
  async sendEmail(to: string, subject: string, htmlContent: string, recipientID?: string): Promise<any> {
    return apiRequest('/business/send-email', {
      method: 'POST',
      body: JSON.stringify({ to, subject, htmlContent, recipientID }),
    });
  },

  /**
   * Send WhatsApp message to a recipient
   */
  async sendWhatsApp(data: CommunicationData): Promise<any> {
    return apiRequest('/business/send-whatsapp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Send bulk messages
   */
  async sendBulk(
    recipients: any[],
    messageType: 'sms' | 'email' | 'whatsapp',
    message: string,
    subject?: string
  ): Promise<any> {
    return apiRequest('/business/send-bulk', {
      method: 'POST',
      body: JSON.stringify({ recipients, messageType, message, subject }),
    });
  },

  /**
   * Send templated message
   */
  async sendTemplate(
    templateName: string,
    recipient: any,
    data: any,
    messageType: 'sms' | 'email' = 'email'
  ): Promise<any> {
    return apiRequest('/business/send-template', {
      method: 'POST',
      body: JSON.stringify({ templateName, recipient, data, messageType }),
    });
  },
};

// ==========================================
// Dashboard Service
// ==========================================

export const dashboardService = {
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<any> {
    return apiRequest('/business/dashboard-stats', {
      method: 'GET',
    });
  },

  /**
   * Get recent activities log
   */
  async getRecentActivities(limit: number = 20): Promise<any[]> {
    return apiRequest(`/business/recent-activities?limit=${limit}`, {
      method: 'GET',
    });
  },
};

// Export all services as a single object
export const businessLogicAPI = {
  guest: guestService,
  checkIn: checkInService,
  donation: donationService,
  communication: communicationService,
  dashboard: dashboardService,
};

export default businessLogicAPI;
