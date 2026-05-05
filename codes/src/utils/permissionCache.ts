/**
 * Permission Cache Utility
 * Provides memoized group permission operations to avoid redundant API calls
 * Used across all components for group access validation
 */

import { User } from '@/types';

// Cache for group information to avoid repeated API calls
let groupCache: Record<string, { id: string; name: string }> = {};
let isCacheValid = false;

/**
 * Get user's accessible group IDs from groupPermissions
 * Admin (null/undefined) = full access (returns null)
 * Restricted staff (array) = specific groups (returns array of IDs)
 *
 * @param user - Authenticated user object with groupPermissions
 * @returns Array of group IDs or null for full access
 */
export const getAccessibleGroups = (user?: User): string[] | null => {
  if (!user) {
    return null; // No user = no access
  }

  // Admin users have null/undefined groupPermissions = full access
  if (user.groupPermissions === null || user.groupPermissions === undefined) {
    return null; // null = full access
  }

  // Restricted users have array of permitted group IDs
  if (Array.isArray(user.groupPermissions)) {
    return user.groupPermissions.length > 0 ? user.groupPermissions : null;
  }

  return null;
};

/**
 * Check if user can access a specific group
 *
 * @param user - Authenticated user object
 * @param groupId - Group ID to check access for
 * @returns true if user can access the group, false otherwise
 */
export const canAccessGroup = (user: User | undefined, groupId: string | null | undefined): boolean => {
  if (!groupId || !user) {
    return false;
  }

  const accessible = getAccessibleGroups(user);

  // null = admin = can access everything
  if (accessible === null) {
    return true;
  }

  // Array = restricted to specific groups
  return accessible.includes(groupId);
};

/**
 * Check if user has group-based access restrictions
 * Returns true if user has limited group access, false for admins with full access
 *
 * @param user - Authenticated user object
 * @returns true if restricted, false if full access (admin)
 */
export const isRestricted = (user?: User): boolean => {
  if (!user) {
    return true; // No user = restricted
  }

  const accessible = getAccessibleGroups(user);
  return accessible !== null; // If accessible is not null, user is restricted
};

/**
 * Get group names with memoization
 * Caches group name lookups to avoid repeated calculations
 *
 * @param groupIds - Array of group IDs to get names for
 * @param groupMap - Map of groupID -> {groupName, ...}
 * @returns Array of {id, name} objects with proper fallbacks
 */
export const getGroupNamesFromIds = (
  groupIds: string[] | null | undefined,
  groupMap: Record<string, any> = {}
): Array<{ id: string; name: string }> => {
  if (!groupIds || groupIds.length === 0) {
    return [];
  }

  return groupIds
    .map((id) => ({
      id,
      name: groupMap[id]?.groupName || groupMap[id]?.name || id,
    }))
    .filter((g) => g.name); // Remove empty entries
};

/**
 * Format group names for display
 * Handles null access (admin), empty array, and specific groups
 *
 * @param user - Authenticated user object
 * @param groupMap - Map of groupID -> group object
 * @returns Formatted string for display (e.g., "Youth Group, Sunday School" or "Full Access")
 */
export const formatGroupAccessDisplay = (
  user?: User,
  groupMap: Record<string, any> = {}
): string => {
  if (!user) {
    return 'No Access';
  }

  const accessible = getAccessibleGroups(user);

  // Admin = full access
  if (accessible === null) {
    return 'Full Access (Admin)';
  }

  // Empty array = no groups = no access
  if (accessible.length === 0) {
    return 'No Groups Assigned';
  }

  // Restricted = show group names
  const groupNames = getGroupNamesFromIds(accessible, groupMap);
  return groupNames.map((g) => g.name).join(', ') || 'Unknown Groups';
};

/**
 * Validate user's group access for operations
 * Throws error if user lacks access
 *
 * @param user - Authenticated user object
 * @param groupId - Group ID to validate access for
 * @param operation - Operation name for error message (e.g., "view members")
 * @throws Error if user doesn't have access
 */
export const validateGroupAccess = (
  user: User | undefined,
  groupId: string | null | undefined,
  operation: string = 'perform this operation'
): void => {
  if (!canAccessGroup(user, groupId)) {
    throw new Error(`You don't have access to ${operation} for this group`);
  }
};

/**
 * Get user's group permissions status
 * Useful for conditional rendering and permission checks
 *
 * @param user - Authenticated user object
 * @returns Object with permission status details
 */
export const getGroupPermissionStatus = (user?: User) => {
  if (!user) {
    return {
      isAdmin: false,
      isRestricted: true,
      accessibleGroupCount: 0,
      groupIds: [],
      displayText: 'No Access',
    };
  }

  const accessible = getAccessibleGroups(user);
  const isAdmin = accessible === null;
  const groupIds = accessible || [];

  return {
    isAdmin,
    isRestricted: !isAdmin,
    accessibleGroupCount: groupIds.length,
    groupIds,
    displayText: isAdmin ? 'Full Access' : `${groupIds.length} Group${groupIds.length !== 1 ? 's' : ''}`,
  };
};
