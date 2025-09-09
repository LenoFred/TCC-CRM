// API Configuration for TCC CRM
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.tccchurch.com' 
  : 'http://localhost:8000';

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

  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, config);
    
    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      removeAuthToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
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

  // Members
  members: {
    getAll: (params?: URLSearchParams) =>
      apiRequest<any[]>(`/members${params ? `?${params}` : ''}`),
    
    getById: (id: string) =>
      apiRequest<any>(`/members/${id}`),
    
    create: (data: any) =>
      apiRequest<any>('/members', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: any) =>
      apiRequest<any>(`/members/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) =>
      apiRequest<void>(`/members/${id}`, { method: 'DELETE' }),
  },

  // Donations
  donations: {
    getPending: () =>
      apiRequest<any[]>('/donations/pending'),
    
    verify: (data: any) =>
      apiRequest<any>('/donations/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Attendance & Gatherings
  gatherings: {
    getAll: () =>
      apiRequest<any[]>('/gatherings'),
    
    getById: (id: string) =>
      apiRequest<any>(`/gatherings/${id}`),
    
    getEligibleMembers: (id: string) =>
      apiRequest<any[]>(`/gatherings/${id}/eligible-members`),
    
    create: (data: any) =>
      apiRequest<any>('/gatherings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Attendance
  attendance: {
    checkIn: (data: { memberIds: string[]; gatheringId: string }) =>
      apiRequest<any>('/attendance/check-in', {
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
        method: 'PUT',
        body: JSON.stringify(permissions),
      }),
  },

  // Communications
  communications: {
    sendBulk: (data: {
      memberIds: string[];
      message: string;
      channels: string[];
    }) =>
      apiRequest<any>('/communications/send-bulk', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
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

  // Analytics & Reports
  reports: {
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

  // Settings & Custom Fields
  settings: {
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

  // Families
  families: {
    getAll: () =>
      apiRequest<any[]>('/families'),
    
    getById: (id: string) =>
      apiRequest<any>(`/families/${id}`),
    
    create: (data: any) =>
      apiRequest<any>('/families', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: any) =>
      apiRequest<any>(`/families/${id}`, {
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