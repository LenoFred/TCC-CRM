// API Configuration for TCC CRM
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.tccchurch.com'
  : 'http://localhost:3001/api';

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
  options: RequestInit = {}
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
    login: (credentials: { email: string; password: string }) =>
      apiRequest<{ token: string; user: any; permissions: string[] }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    
    logout: () =>
      apiRequest<void>('/auth/logout', { method: 'POST' }),
    
    refresh: () =>
      apiRequest<{ token: string }>('/auth/refresh', { method: 'POST' }),
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
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiRequest<any>(`/donations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // Attendance
  attendance: {
    getAll: (params?: URLSearchParams) => {
      const timestamp = Date.now();
      const separator = params ? '&' : '?';
      return apiRequest<any[]>(`/attendance${params ? `?${params}` : ''}${separator}_t=${timestamp}`);
    },

    getByMember: (memberID: string) => {
      const timestamp = Date.now();
      return apiRequest<{memberID: string; total: number; attendance: any[]}>(`/attendance/member/${memberID}?_t=${timestamp}`);
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
      return apiRequest<{success: boolean; data: any[]}>(`/group-members/group/${groupID}?_t=${timestamp}`);
    },
  },

  // Groups
  groups: {
    getAll: (params?: URLSearchParams) =>
      apiRequest<{success: boolean; data: any[]}>(`/groups${params ? `?${params}` : ''}`),

    getById: (id: string) =>
      apiRequest<{success: boolean; data: any}>(`/groups/${id}`),

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
        method: 'PUT',
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

  // Communications
  communications: {
    send: (data: any) =>
      apiRequest<any>('/communications/send', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    schedule: (data: any) =>
      apiRequest<any>('/communications/schedule', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    recipients: {
      groups: () =>
        apiRequest<any[]>('/recipients/groups'),

      staff: () =>
        apiRequest<any[]>('/recipients/staff'),
    },

    // Drafts management
    getDrafts: () =>
      apiRequest<any[]>('/communications/drafts'),
    
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
    getScheduled: () =>
      apiRequest<any[]>('/communications/scheduled'),
    
    createScheduled: (data: any) =>
      apiRequest<any>('/communications/scheduled', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    updateScheduled: (id: string, data: any) =>
      apiRequest<any>(`/communications/scheduled/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    deleteScheduled: (id: string) =>
      apiRequest<void>(`/communications/scheduled/${id}`, { method: 'DELETE' }),
  },

  // Analytics
  analytics: {
    attendanceSummary: () =>
      apiRequest<any>('/analytics/attendance-summary'),

    donationsSummary: () =>
      apiRequest<any>('/analytics/donations-summary'),

    custom: (data: {
      dataSource: string;
      filters: any[];
      outputFields: string[];
    }) =>
      apiRequest<any[]>('/reports/custom', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getHistory: () =>
      apiRequest<any[]>('/analytics/history'),
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
      apiRequest<any[]>('/volunteer-assignments'),

    createAssignment: (data: {
      memberId: string;
      gatheringId: string;
      roleId: string;
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
};

export default api;