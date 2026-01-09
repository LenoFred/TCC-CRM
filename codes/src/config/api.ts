// API Configuration for TCC CRM
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  process.env.NODE_ENV === 'production'
    ? 'https://tcc-crm-backend.vercel.app/api'
    : 'http://localhost:3001/api'
);

// CORS configuration headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// API client configuration
export const apiConfig = {
  baseURL: API_BASE_URL,
  headers: corsHeaders,
  withCredentials: true, // Enable cookies for cross-origin requests
  timeout: 30000, // 30 second timeout
};

// JWT token management
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

// Enhanced fetch wrapper with CORS support and authentication
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...corsHeaders,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    credentials: 'include', // Include cookies for CORS
    mode: 'cors', // Explicitly set CORS mode
  };

  // Add cache-busting timestamp for GET requests
  let url = `${API_BASE_URL}${endpoint}`;
  if (!options.method || options.method.toUpperCase() === 'GET') {
    const separator = endpoint.includes('?') ? '&' : '?';
    url += `${separator}_t=${Date.now()}`;
  }
  
  try {
    const response = await fetch(url, config);
    
    // Handle 401 Unauthorized - DISABLED redirect to login
    // if (response.status === 401) {
    //   removeAuthToken();
    //   window.location.href = '/login';
    //   throw new Error('Unauthorized');
    // }
    
    // Handle 429 Rate Limit - Retry with exponential backoff
    if (response.status === 429 && retries > 0) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
      const delay = retryAfter * 1000 || (3 - retries) * 1000; // Exponential backoff
      console.log(`Rate limited (429). Retrying after ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiRequest<T>(endpoint, options, retries - 1);
    }
    
    // Handle other HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Return JSON response
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Pre-configured API methods
export const api = {
  // Authentication
  auth: {
    login: (credentials: { username: string; password: string }) =>
      apiRequest<{ accessToken: string; refreshToken: string; user: any; permissions: any[] }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    
    logout: () =>
      apiRequest<void>('/auth/logout', { method: 'POST' }),
    
    refresh: (refreshToken: string) =>
      apiRequest<{ accessToken: string }>('/auth/refresh', { 
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),
    
    me: () =>
      apiRequest<{ user: any; permissions: any[] }>('/auth/me', { method: 'GET' }),
    
    hashPassword: (password: string) =>
      apiRequest<{ hashedPassword: string }>('/auth/hash-password', {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
    
    resetPassword: (staffId: string, newPassword: string) =>
      apiRequest<{ success: boolean; message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ staffId, newPassword }),
      }),
  },

  // Metrics
  metrics: {
    get: () =>
      apiRequest<any>('/metrics'),
  },

  // Members
  members: {
    getAll: (params?: URLSearchParams) => {
      const timestamp = Date.now();
      const separator = params ? '&' : '?';
      return apiRequest<{success: boolean; data: any[]; total: number}>(`/members${params ? `?${params}` : ''}${separator}_t=${timestamp}`);
    },
    
    getById: (id: string) => {
      const timestamp = Date.now();
      return apiRequest<{success: boolean; data: any}>(`/members/${id}?_t=${timestamp}`);
    },
    
    create: (data: any) =>
      apiRequest<any>('/members', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: any) =>
      apiRequest<any>(`/members/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) =>
      apiRequest<void>(`/members/${id}`, { method: 'DELETE' }),
    
    getStats: () =>
      apiRequest<{success: boolean; data: any}>('/members/stats'),
  },

  // Donations
  donations: {
    getAll: (params?: URLSearchParams) => {
      const timestamp = Date.now();
      const separator = params ? '&' : '?';
      return apiRequest<any[]>(`/donations${params ? `?${params}` : ''}${separator}_t=${timestamp}`);
    },

    getByMember: (memberID: string) => {
      const timestamp = Date.now();
      return apiRequest<{memberID: string; total: number; totalAmount: number; donations: any[]}>(`/donations/member/${memberID}?_t=${timestamp}`);
    },

    verify: (id: string, data: any) =>
      apiRequest<any>(`/donations/${id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiRequest<any>(`/donations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiRequest<any>(`/donations/${id}`, {
        method: 'DELETE',
      }),
  },

  // Attendance
  attendance: {
    getAll: (params?: URLSearchParams) => {
      const timestamp = Date.now();
      const separator = params ? '&' : '?';
      return apiRequest<{ success: boolean; data: any[]; total: number }>(`/attendance${params ? `?${params}` : ''}${separator}_t=${timestamp}`);
    },

    getByMember: (memberID: string) => {
      const timestamp = Date.now();
      return apiRequest<{memberID: string; total: number; attendance: any[]}>(`/attendance/member/${memberID}?_t=${timestamp}`);
    },

    getByGathering: (gatheringID: string) => {
      const timestamp = Date.now();
      return apiRequest<{gatheringID: string; total: number; attendance: any[]}>(`/attendance/gathering/${gatheringID}?_t=${timestamp}`);
    },
  },

  // Group Members
  groupMembers: {
    getAll: (params?: URLSearchParams) => {
      const timestamp = Date.now();
      const separator = params ? '&' : '?';
      return apiRequest<{success: boolean; data: any[]}>(`/group-members${params ? `?${params}` : ''}${separator}_t=${timestamp}`);
    },

    getByMember: (memberID: string) => {
      const timestamp = Date.now();
      return apiRequest<{memberID: string; total: number; groups: any[]}>(`/group-members/member/${memberID}?_t=${timestamp}`);
    },

    getByGroup: (groupID: string) => {
      const timestamp = Date.now();
      return apiRequest<{success: boolean; groupID: string; total: number; members: any[]}>(`/group-members/group/${groupID}?_t=${timestamp}`);
    },
    
    create: (data: any) =>
      apiRequest<{success: boolean; data: any}>('/group-members', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    batchCreate: (membersData: any[]) =>
      apiRequest<{success: boolean; message: string; addedCount: number; data: any[]}>('/group-members/batch-create', {
        method: 'POST',
        body: JSON.stringify(membersData),
      }),
    
    delete: (groupMemberID: string) =>
      apiRequest<{success: boolean; message: string}>(`/group-members/${groupMemberID}`, {
        method: 'DELETE',
      }),

    batchDelete: (groupMemberIDs: string[]) =>
      apiRequest<{success: boolean; message: string; deletedCount: number}>('/group-members/batch-delete', {
        method: 'POST',
        body: JSON.stringify({ groupMemberIDs }),
      }),
  },

  // Groups
  groups: {
    getAll: (params?: URLSearchParams) =>
      apiRequest<{success: boolean; data: any[]}>(`/groups${params ? `?${params}` : ''}`),

    getById: (id: string) =>
      apiRequest<{success: boolean; data: any}>(`/groups/${id}`),

    getWithMembers: (id: string) =>
      apiRequest<{success: boolean; data: any}>(`/groups/${id}/members`),

    create: (data: any) =>
      apiRequest<any>('/groups', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiRequest<any>(`/groups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiRequest<void>(`/groups/${id}`, { method: 'DELETE' }),
  },

  // Events
  events: {
    getAll: (params?: URLSearchParams) =>
      apiRequest<any[]>(`/events${params ? `?${params}` : ''}`),

    getById: (id: string) =>
      apiRequest<any>(`/events/${id}`),

    getDetails: (id: string) =>
      apiRequest<any>(`/events/${id}/details`),

    getAttendees: (id: string) =>
      apiRequest<any[]>(`/events/${id}/attendees`),

    getGuests: (id: string) =>
      apiRequest<any[]>(`/events/${id}/guests`),

    create: (data: any) =>
      apiRequest<any>('/events', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiRequest<any>(`/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    checkin: (id: string, data: any) =>
      apiRequest<any>(`/events/${id}/checkin`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    finish: (id: string, data: any) =>
      apiRequest<any>(`/events/${id}/finish`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    followup: (id: string, data: any) =>
      apiRequest<any>(`/events/${id}/followup`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Gatherings
  gatherings: {
    getAll: (params?: URLSearchParams) =>
      apiRequest<{success: boolean; data: any[]}>(`/gatherings${params ? `?${params}` : ''}`),

    getById: (id: string) =>
      apiRequest<{success: boolean; data: any}>(`/gatherings/${id}`),

    getByParent: (parentID: string) =>
      apiRequest<{success: boolean; parentID: string; total: number; data: any[]}>(`/gatherings/parent/${parentID}`),

    getByGroup: (groupID: string) =>
      apiRequest<{success: boolean; groupID: string; total: number; data: any[]}>(`/gatherings/group/${groupID}`),

    create: (data: any) =>
      apiRequest<{success: boolean; data: any}>('/gatherings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiRequest<{success: boolean; data: any}>(`/gatherings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiRequest<void>(`/gatherings/${id}`, { method: 'DELETE' }),

    getStats: () =>
      apiRequest<{success: boolean; data: any}>('/gatherings/stats'),
  },

  // Staff Management
  staff: {
    getAll: () =>
      apiRequest<any[]>('/staff'),
    
    getById: (id: string) =>
      apiRequest<any>(`/staff/${id}`),
    
    create: (data: any) =>
      apiRequest<any>('/staff', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: any) =>
      apiRequest<any>(`/staff/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    
    getPermissions: (id: string) =>
      apiRequest<string[]>(`/staff/${id}/permissions`),
    
    updatePermissions: (id: string, permissions: Record<string, boolean>) =>
      apiRequest<any>(`/staff/${id}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify(permissions),
      }),
  },

  // Staff Permissions
  staffPermissions: {
    // Get all available permissions in the system
    getAvailable: () =>
      apiRequest<{ success: boolean; total: number; permissions: any[]; grouped: Record<string, any[]> }>('/staff-permissions/available'),
    
    // Get permissions for a specific staff member
    getByStaffId: (staffId: string) =>
      apiRequest<{ success: boolean; staffId: string; total: number; permissions: any[] }>(`/staff-permissions/${staffId}`),
    
    // Update permissions for a staff member
    update: (staffId: string, permissions: string[]) =>
      apiRequest<{ success: boolean; message: string; staffId: string; updated: number; created: number; totalGranted: number }>(`/staff-permissions/${staffId}`, {
        method: 'POST',
        body: JSON.stringify({ permissions }),
      }),
  },

  // Communications
  communications: {
    // Send message with email provider option
    send: (data: any) =>
      apiRequest<any>('/communications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Get communications history with filters
    getHistory: (filters?: { startDate?: string; endDate?: string; channel?: string; status?: string }) => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.channel) params.append('channel', filters.channel);
      if (filters?.status) params.append('status', filters.status);
      const query = params.toString();
      return apiRequest<{success: boolean; count: number; filters: any; data: any[]}>(`/communications/history${query ? `?${query}` : ''}`);
    },

    // Get analytics (cost, peak times, delivery rates)
    getAnalytics: (startDate?: string, endDate?: string) => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const query = params.toString();
      return apiRequest<{success: boolean; dateRange: any; costAnalysis: any; peakTimes: any; deliveryRates: any}>(`/communications/analytics${query ? `?${query}` : ''}`);
    },

    // Get communication statistics
    getStats: (startDate?: string, endDate?: string) => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const query = params.toString();
      return apiRequest<any>(`/communications/stats${query ? `?${query}` : ''}`);
    },

    schedule: (data: any) =>
      apiRequest<any>('/communications/schedule', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    recipients: {
      groups: () =>
        apiRequest<any[]>('/groups'),

      staff: () =>
        apiRequest<any[]>('/staff'),
    },

    // Drafts management
    getDrafts: () =>
      apiRequest<{success: boolean; data: any[]}>('/communications/drafts'),
    
    createDraft: (data: any) =>
      apiRequest<any>('/communications/drafts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    updateDraft: (id: string, data: any) =>
      apiRequest<any>(`/communications/drafts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    deleteDraft: (id: string) =>
      apiRequest<void>(`/communications/drafts/${id}`, { method: 'DELETE' }),
    
    // Scheduled messages
    getScheduled: (params?: { search?: string; scheduleType?: string; status?: string; page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append('search', params.search);
      if (params?.scheduleType) searchParams.append('scheduleType', params.scheduleType);
      if (params?.status) searchParams.append('status', params.status);
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      const query = searchParams.toString();
      return apiRequest<{success: boolean; data: any[]; total: number}>(`/communications/scheduled${query ? `?${query}` : ''}`);
    },

    getAllScheduled: () =>
      apiRequest<{success: boolean; data: any[]}>('/communications/scheduled/all'),

    getScheduledById: (id: string) =>
      apiRequest<{success: boolean; data: any}>(`/communications/scheduled/${id}`),
    
    createScheduled: (data: any) =>
      apiRequest<{success: boolean; data: any}>('/communications/scheduled', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    updateScheduled: (id: string, data: any) =>
      apiRequest<{success: boolean; data: any}>(`/communications/scheduled/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    cancelScheduled: (id: string) =>
      apiRequest<{success: boolean; message: string}>(`/communications/scheduled/${id}/cancel`, {
        method: 'POST',
      }),
    
    deleteScheduled: (id: string) =>
      apiRequest<void>(`/communications/scheduled/${id}`, { method: 'DELETE' }),
  },

  // Analytics
  analytics: {
    generateReport: (data: {
      dataSource: string;
      filters: any[];
      outputFields?: string[];
      limit?: number;
    }) =>
      apiRequest<{success: boolean; data: any[]; total: number; returned: number}>('/analytics/generate-report', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getSheetColumns: (sheetName: string) =>
      apiRequest<{success: boolean; data: any[]}>(`/analytics/sheet-columns/${sheetName}`),

    getSummaryStats: () =>
      apiRequest<{success: boolean; data: any}>('/analytics/summary-stats'),

    exportReport: (data: any[], fileName?: string) =>
      apiRequest<any>('/analytics/export', {
        method: 'POST',
        body: JSON.stringify({ data, fileName }),
      }),
  },

  // Guests
  guests: {
    convert: (id: string, data: any) =>
      apiRequest<any>(`/guests/${id}/convert`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Settings & Custom Fields
  settings: {
    get: () =>
      apiRequest<any>('/settings'),

    update: (data: any) =>
      apiRequest<any>('/settings', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    getSheets: () =>
      apiRequest<string[]>('/settings/sheets'),

    getCustomFields: (sheet?: string) =>
      apiRequest<any[]>(`/settings/custom-fields${sheet ? `?sheet=${sheet}` : ''}`),

    createCustomField: (data: {
      sheetName: string;
      fieldName: string;
      dataType: string;
      options?: string[];
    }) =>
      apiRequest<any>('/settings/custom-fields', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateCustomField: (id: string, data: any) =>
      apiRequest<any>(`/settings/custom-fields/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Schema
  schema: {
    members: () =>
      apiRequest<any>('/schema/members'),
  },

  // Families
  families: {
    getAll: () => {
      const timestamp = Date.now();
      return apiRequest<{ success: boolean; data: any[]; total: number }>(`/families?_t=${timestamp}`);
    },
    
    getById: (id: string) => {
      const timestamp = Date.now();
      return apiRequest<{ success: boolean; data: any }>(`/families/${id}?_t=${timestamp}`);
    },
    
    create: (data: any) =>
      apiRequest<{ success: boolean; data: any }>('/families', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: any) =>
      apiRequest<{ success: boolean; data: any }>(`/families/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) =>
      apiRequest<void>(`/families/${id}`, { method: 'DELETE' }),
  },

  // Volunteer Management
  volunteers: {
    // Volunteer sheet (form submissions)
    getAll: (params?: URLSearchParams) =>
      apiRequest<any[]>(`/volunteers${params ? `?${params}` : ''}`),

    // Volunteer roles
    getRoles: () =>
      apiRequest<any[]>('/volunteer-roles'),
    
    createRole: (data: { roleName: string; description: string }) =>
      apiRequest<any>('/volunteer-roles', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    updateRole: (id: string, data: any) =>
      apiRequest<any>(`/volunteer-roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    deleteRole: (id: string) =>
      apiRequest<void>(`/volunteer-roles/${id}`, { method: 'DELETE' }),
    
    getAll: (params?: URLSearchParams) =>
      apiRequest<any[]>(`/volunteers${params ? `?${params}` : ''}`),

    assign: (data: any) =>
      apiRequest<any>('/volunteers/assign', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getAssignments: () =>
      apiRequest<any[]>(`/volunteer-assignments?_t=${Date.now()}`),

    getAssignmentsByRole: (roleID: string) =>
      apiRequest<{roleID: string; total: number; assignments: any[]}>(`/volunteer-assignments/role/${roleID}`),

    createAssignment: (data: {
      memberID: string;
      groupID: string;
      roleID: string;
      assignmentStatus?: string;
    }) =>
      apiRequest<any>('/volunteer-assignments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    updateAssignment: (id: string, data: any) =>
      apiRequest<any>(`/volunteer-assignments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Branches
  branches: {
    getAll: () =>
      apiRequest<any[]>('/branches'),

    getById: (id: string) =>
      apiRequest<any>(`/branches/${id}`),

    getMembers: (id: string) =>
      apiRequest<any[]>(`/branches/${id}/members`),

    create: (data: any) =>
      apiRequest<any>('/branches', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiRequest<any>(`/branches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiRequest<void>(`/branches/${id}`, { method: 'DELETE' }),
  },

  // Check-in & Attendance
  checkIn: {
    checkInMember: (data: { memberID: string; gatheringID: string; method?: string; notes?: string }) =>
      apiRequest<{ success: boolean; data: any }>('/business/check-in', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getAttendees: (gatheringID: string) =>
      apiRequest<{ success: boolean; data: any[] }>(`/attendance?gatheringID=${gatheringID}`),
  },

  // Guest Management
  guestManagement: {
    registerGuest: (data: { firstName: string; lastName: string; phone: string; email?: string; gatheringID?: string }) =>
      apiRequest<{ success: boolean; data: any }>('/business/guest-register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    getAllGuests: () =>
      apiRequest<{ success: boolean; data: any[]; count: number }>('/business/guests'),
  },

  // Settings & Integrations
  settings: {
    getIntegrationStatus: () =>
      apiRequest<{ success: boolean; integrations: any }>('/settings/integrations/status'),
  },
};

export default api;