// Guest Tracking Utilities for TCC CRM

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  firstVisit: string;
  lastVisit: string;
  visitCount: number;
  status: 'New' | 'Returning' | 'Member';
  source: 'Walk-in' | 'Invitation' | 'Online' | 'Event';
  followUpStatus: 'Pending' | 'Contacted' | 'Scheduled' | 'Completed';
  assignedTo?: string; // Staff member ID
  notes?: string;
}

export interface GuestVisit {
  id: string;
  guestId: string;
  eventId: string;
  eventName: string;
  visitDate: string;
  checkedInBy: string; // Staff member ID
}

// Guest tracking service
export class GuestTrackingService {
  static createGuest(guestData: Partial<Guest>): Guest {
    const now = new Date().toISOString();
    return {
      id: `guest_${Date.now()}`,
      name: guestData.name || '',
      phone: guestData.phone || '',
      email: guestData.email,
      firstVisit: now,
      lastVisit: now,
      visitCount: 1,
      status: 'New',
      source: guestData.source || 'Walk-in',
      followUpStatus: 'Pending',
      assignedTo: guestData.assignedTo,
      notes: guestData.notes,
      ...guestData
    };
  }

  static recordVisit(guest: Guest, eventData: { id: string; name: string; checkedInBy: string }): GuestVisit {
    return {
      id: `visit_${Date.now()}`,
      guestId: guest.id,
      eventId: eventData.id,
      eventName: eventData.name,
      visitDate: new Date().toISOString(),
      checkedInBy: eventData.checkedInBy
    };
  }

  static updateGuestVisitCount(guest: Guest): Guest {
    return {
      ...guest,
      visitCount: guest.visitCount + 1,
      lastVisit: new Date().toISOString(),
      status: guest.visitCount >= 3 ? 'Returning' : guest.status
    };
  }

  static generateFollowUpTasks(guests: Guest[]): Array<{
    guestId: string;
    guestName: string;
    taskType: string;
    priority: 'High' | 'Medium' | 'Low';
    dueDate: string;
    description: string;
  }> {
    const now = new Date();
    const tasks: Array<{
      guestId: string;
      guestName: string;
      taskType: string;
      priority: 'High' | 'Medium' | 'Low';
      dueDate: string;
      description: string;
    }> = [];

    guests.forEach(guest => {
      const lastVisitDate = new Date(guest.lastVisit);
      const daysSinceVisit = Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));

      if (guest.status === 'New' && guest.followUpStatus === 'Pending') {
        // First-time visitor follow-up (within 24-48 hours)
        const dueDate = new Date(lastVisitDate);
        dueDate.setDate(dueDate.getDate() + 2);
        
        tasks.push({
          guestId: guest.id,
          guestName: guest.name,
          taskType: 'Welcome Call/Message',
          priority: 'High',
          dueDate: dueDate.toISOString(),
          description: `Welcome new visitor ${guest.name}. Thank them for visiting and invite them back.`
        });
      }

      if (guest.visitCount >= 2 && guest.status !== 'Member' && daysSinceVisit > 7) {
        // Regular visitor follow-up
        tasks.push({
          guestId: guest.id,
          guestName: guest.name,
          taskType: 'Membership Invitation',
          priority: 'Medium',
          dueDate: new Date().toISOString(),
          description: `${guest.name} has visited ${guest.visitCount} times. Consider inviting to membership.`
        });
      }

      if (daysSinceVisit > 30 && guest.status === 'Returning') {
        // Re-engagement follow-up
        tasks.push({
          guestId: guest.id,
          guestName: guest.name,
          taskType: 'Re-engagement',
          priority: 'Low',
          dueDate: new Date().toISOString(),
          description: `${guest.name} hasn't visited in over 30 days. Send re-engagement message.`
        });
      }
    });

    return tasks;
  }
}

// API endpoints for guest tracking
export const guestTrackingAPI = {
  // Get all guests with optional filters
  getGuests: (filters?: {
    status?: string;
    followUpStatus?: string;
    assignedTo?: string;
    dateRange?: { start: string; end: string };
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.followUpStatus) params.append('followUpStatus', filters.followUpStatus);
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start);
      params.append('endDate', filters.dateRange.end);
    }
    
    return `/guests${params.toString() ? `?${params}` : ''}`;
  },

  // Create new guest
  createGuest: () => '/guests',

  // Update guest information
  updateGuest: (guestId: string) => `/guests/${guestId}`,

  // Record guest visit
  recordVisit: () => '/guests/visits',

  // Get guest visits
  getVisits: (guestId?: string) => 
    guestId ? `/guests/${guestId}/visits` : '/guests/visits',

  // Convert guest to member
  convertToMember: (guestId: string) => `/guests/${guestId}/convert-to-member`,

  // Get follow-up tasks
  getFollowUpTasks: () => '/guests/follow-up-tasks',

  // Update follow-up status
  updateFollowUpStatus: (guestId: string) => `/guests/${guestId}/follow-up-status`
};