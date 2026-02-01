import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { saveToStore } from '../utils/indexedDB';
import { preloadMultiple } from '../utils/cacheStrategy';

interface User {
  userId: string;
  email: string;
  memberId: string;
  role: string;
  firstName?: string;
  lastName?: string;
  groupPermissions?: string[]; // Array of permitted group IDs, null = full access
}

interface Permission {
  permissionKey: string;
  hasAccess: boolean;
}

interface AuthContextType {
  user: User | null;
  permissions: Permission[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, loginType: 'Admin' | 'Staff') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  checkPermission: (permissionKey: string) => boolean;
  hasGroupAccess: (groupId: string) => boolean; // Check if user has access to specific group
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'tcc_access_token';
const REFRESH_TOKEN_KEY = 'tcc_refresh_token';
const USER_KEY = 'tcc_user';
const PERMISSIONS_KEY = 'tcc_permissions';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-refresh token before expiry
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated) {
        refreshAccessToken().catch(() => {
          // Silent fail - user will be logged out on next request
        });
      }
    }, 20 * 60 * 1000); // Refresh every 20 minutes (token expires in 30)

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Check for stored auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);
        const storedPermissions = localStorage.getItem(PERMISSIONS_KEY);

        if (token && storedUser && storedPermissions) {
          const parsedPermissions = JSON.parse(storedPermissions);
          
          // Handle migration from old string array format to Permission objects
          const permissionsData = Array.isArray(parsedPermissions) 
            ? parsedPermissions.map((perm: any) => 
                typeof perm === 'string' 
                  ? { permissionKey: perm, hasAccess: true }
                  : perm
              )
            : [];
          
          setUser(JSON.parse(storedUser));
          setPermissions(permissionsData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // Clear invalid data
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(PERMISSIONS_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string, loginType: 'Admin' | 'Staff') => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, loginType }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Login failed' };
      }

      const data = await response.json();
      
      // Debug logging to check permissions
      console.log('Login response:', { 
        hasPermissions: !!data.permissions, 
        permissionsCount: data.permissions?.length,
        permissions: data.permissions 
      });

      // Store tokens and user data
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      
      // Parse groupPermissions from comma-separated string to array
      const userData = {
        ...data.user,
        groupPermissions: data.user.groupPermissions 
          ? data.user.groupPermissions.split(',').filter((id: string) => id.trim())
          : null
      };
      
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      // Convert permissions from string array to Permission objects
      const permissionsData = (data.permissions || []).map((perm: string) => ({
        permissionKey: perm,
        hasAccess: true
      }));
      
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissionsData));
      setPermissions(permissionsData);
      setIsAuthenticated(true);

      // Cache essential data for offline use (non-blocking)
      if (navigator.onLine) {
        cacheEssentialData().catch((error) => {
          console.error('[Auth] Failed to cache data:', error);
          // Don't fail login if caching fails
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Invalid credentials' 
      };
    }
  };

  const logout = () => {
    // Clear all stored data
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PERMISSIONS_KEY);

    setUser(null);
    setPermissions([]);
    setIsAuthenticated(false);
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      // Update access token
      localStorage.setItem(TOKEN_KEY, data.accessToken);

      return Promise.resolve();
    } catch (error) {
      console.error('Token refresh error:', error);
      // Force logout on refresh failure
      logout();
      return Promise.reject(error);
    }
  };

  const checkPermission = (permissionKey: string): boolean => {
    // Admins have all permissions
    if (user?.role?.toLowerCase() === 'admin') {
      return true;
    }

    // Safety check: ensure permissions is an array
    if (!permissions || !Array.isArray(permissions)) {
      return false;
    }

    // Check if permission exists and is enabled
    const permission = permissions.find(p => p.permissionKey === permissionKey);
    if (permission?.hasAccess === true) {
      return true;
    }

    // Hierarchical permissions: higher permissions grant lower ones
    // If checking for view permission, check if user has edit/manage/generate permission
    if (permissionKey.startsWith('can_view_')) {
      const resource = permissionKey.replace('can_view_', '');
      const hierarchicalPermissions = [
        `can_edit_${resource}`,
        `can_manage_${resource}`,
        `can_delete_${resource}`,
        `can_generate_${resource}`,
        `can_verify_${resource}`,
        `can_take_${resource}`,
      ];
      
      return hierarchicalPermissions.some(higherPerm => 
        permissions.find(p => p.permissionKey === higherPerm && p.hasAccess === true)
      );
    }

    // If checking for edit permission, check if user has manage/delete permission
    if (permissionKey.startsWith('can_edit_')) {
      const resource = permissionKey.replace('can_edit_', '');
      const hierarchicalPermissions = [
        `can_manage_${resource}`,
        `can_delete_${resource}`,
      ];
      
      return hierarchicalPermissions.some(higherPerm => 
        permissions.find(p => p.permissionKey === higherPerm && p.hasAccess === true)
      );
    }

    return false;
  };

  // Cache essential data for offline use
  const cacheEssentialData = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      console.log('[Auth] No token available for caching');
      return;
    }

    console.log('[Auth] 📥 Caching essential data for offline use...');

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      // Fetch all essential data in parallel
      const resources = [
        {
          endpoint: '/members',
          fetcher: async () => {
            const response = await fetch(`${apiUrl}/api/members`, { headers });
            const data = await response.json();
            // Store in members IndexedDB store
            if (data.success && data.data) {
              await saveToStore('members', data.data);
              console.log(`[Auth] ✅ Cached ${data.data.length} members`);
            }
            return data;
          },
        },
        {
          endpoint: '/donations',
          fetcher: async () => {
            const response = await fetch(`${apiUrl}/api/donations`, { headers });
            const data = await response.json();
            // Store in donations IndexedDB store
            if (Array.isArray(data)) {
              await saveToStore('donations', data);
              console.log(`[Auth] ✅ Cached ${data.length} donations`);
            }
            return data;
          },
        },
        {
          endpoint: '/groups',
          fetcher: async () => {
            const response = await fetch(`${apiUrl}/api/groups`, { headers });
            const data = await response.json();
            // Store in groups IndexedDB store
            if (data.success && data.data) {
              await saveToStore('groups', data.data);
              console.log(`[Auth] ✅ Cached ${data.data.length} groups`);
            }
            return data;
          },
        },
        {
          endpoint: '/gatherings',
          fetcher: async () => {
            const response = await fetch(`${apiUrl}/api/gatherings`, { headers });
            const data = await response.json();
            // Store in gatherings IndexedDB store
            if (data.success && data.data) {
              await saveToStore('gatherings', data.data);
              console.log(`[Auth] ✅ Cached ${data.data.length} gatherings`);
            }
            return data;
          },
        },
        {
          endpoint: '/guests',
          fetcher: async () => {
            const response = await fetch(`${apiUrl}/api/guests`, { headers });
            const data = await response.json();
            // Store in guests IndexedDB store
            if (data.success && data.data) {
              await saveToStore('guests', data.data);
              console.log(`[Auth] ✅ Cached ${data.data.length} guests`);
            }
            return data;
          },
        },
        {
          endpoint: '/attendance',
          fetcher: async () => {
            const response = await fetch(`${apiUrl}/api/attendance`, { headers });
            const data = await response.json();
            // Store in attendance IndexedDB store
            if (Array.isArray(data)) {
              await saveToStore('attendance', data);
              console.log(`[Auth] ✅ Cached ${data.length} attendance records`);
            }
            return data;
          },
        },
      ];

      // Preload all resources (this also caches API responses)
      await preloadMultiple(resources);

      console.log('[Auth] ✅ All essential data cached successfully!');
    } catch (error) {
      console.error('[Auth] ❌ Data caching failed:', error);
      // Don't throw - caching failure shouldn't break login
    }
  };

  /**
   * Check if user has access to a specific group
   * Returns true if:
   * - User is admin (full access)
   * - groupPermissions is null/undefined (full access - default)
   * - groupId is in the groupPermissions array
   */
  const hasGroupAccess = (groupId: string): boolean => {
    // Admins have access to all groups
    if (user?.role?.toLowerCase() === 'admin') {
      return true;
    }

    // If no groupPermissions defined, full access (backward compatible)
    if (!user?.groupPermissions) {
      return true;
    }

    // Check if groupId is in permitted groups
    return user.groupPermissions.includes(groupId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshAccessToken,
        checkPermission,
        hasGroupAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
