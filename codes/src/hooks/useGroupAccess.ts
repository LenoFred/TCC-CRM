/**
 * useGroupAccess Hook
 * Provides group access checking and filtering utilities for React components
 * Integrated with AuthContext for seamless permission management
 */

import { useAuth } from '@/contexts/AuthContext';
import {
  getAccessibleGroups,
  canAccessGroup,
  isRestricted,
  getGroupNamesFromIds,
  formatGroupAccessDisplay,
  getGroupPermissionStatus,
} from '@/utils/permissionCache';

/**
 * Hook for group access management in components
 * Provides methods to check permissions and filter data by accessible groups
 */
export const useGroupAccess = () => {
  const { user, getGroupNames } = useAuth();

  /**
   * Get user's accessible group IDs
   */
  const accessibleGroups = getAccessibleGroups(user);

  /**
   * Check if user can access a specific group
   */
  const hasAccess = (groupId: string | null | undefined): boolean => {
    return canAccessGroup(user, groupId);
  };

  /**
   * Check if user has group restrictions
   */
  const userIsRestricted = isRestricted(user);

  /**
   * Get permission status details
   */
  const permissionStatus = getGroupPermissionStatus(user);

  /**
   * Filter an array of items by accessible groups
   * Useful for filtering data before display
   *
   * @param items - Array of items with groupID field
   * @param groupField - Name of the group field (default: 'groupID')
   * @returns Filtered array of items user can access
   */
  const filterByAccess = <T extends Record<string, any>>(
    items: T[],
    groupField: string = 'groupID'
  ): T[] => {
    if (!userIsRestricted) {
      return items; // Admin sees everything
    }

    if (!accessibleGroups || accessibleGroups.length === 0) {
      return []; // No groups = no access
    }

    return items.filter((item) =>
      accessibleGroups.includes(item[groupField]?.toString())
    );
  };

  /**
   * Filter members by accessible groups
   * Checks GroupMembers relationship
   *
   * @param members - Array of member objects
   * @param groupMembers - Array of GroupMembers objects
   * @returns Filtered array of members user can access
   */
  const filterMembersByAccess = (
    members: Array<{ memberID: string; [key: string]: any }>,
    groupMembers: Array<{ memberID: string; groupID: string }>
  ) => {
    if (!userIsRestricted) {
      return members; // Admin sees all members
    }

    if (!accessibleGroups || accessibleGroups.length === 0) {
      return []; // No groups = no members
    }

    // Get member IDs from accessible groups
    const accessibleMemberIds = new Set(
      groupMembers
        .filter((gm) => accessibleGroups.includes(gm.groupID))
        .map((gm) => gm.memberID)
    );

    return members.filter((m) => accessibleMemberIds.has(m.memberID));
  };

  /**
   * Get group display names for accessible groups
   */
  const getAccessibleGroupNames = async (): Promise<
    Array<{ id: string; name: string }>
  > => {
    if (!accessibleGroups || accessibleGroups.length === 0) {
      return [];
    }

    try {
      const allGroups = await getGroupNames();
      const groupMap = Object.fromEntries(
        allGroups.map((g) => [g.id, g])
      );
      return getGroupNamesFromIds(accessibleGroups, groupMap);
    } catch (error) {
      console.error('Error fetching group names:', error);
      return accessibleGroups.map((id) => ({ id, name: id }));
    }
  };

  /**
   * Get formatted access display text
   * Used for badges and permission displays
   */
  const getAccessDisplayText = (): string => {
    return formatGroupAccessDisplay(user);
  };

  /**
   * Validate access before operation
   * Throws error if user doesn't have access
   */
  const validateAccess = (
    groupId: string | null | undefined,
    operation: string = 'perform this action'
  ): boolean => {
    if (!hasAccess(groupId)) {
      throw new Error(
        `You don't have permission to ${operation} in this group`
      );
    }
    return true;
  };

  /**
   * Create group selector configuration
   * Pre-filters groups to user's accessible ones
   */
  const getGroupSelectorConfig = () => ({
    isDisabled: !userIsRestricted,
    isMulti: false,
    filterableGroups: accessibleGroups,
    displayText: getAccessDisplayText(),
  });

  return {
    // Direct properties
    accessibleGroups,
    userIsRestricted,
    permissionStatus,
    hasAccess,

    // Methods
    filterByAccess,
    filterMembersByAccess,
    getAccessibleGroupNames,
    getAccessDisplayText,
    validateAccess,
    getGroupSelectorConfig,
  };
};

/**
 * Hook to validate group access and throw on failure
 * Useful for route protection and component guards
 */
export const useRequireGroupAccess = (groupId?: string | null) => {
  const { hasAccess } = useGroupAccess();

  if (groupId && !hasAccess(groupId)) {
    throw new Error('Access Denied: You do not have permission to access this group');
  }

  return { hasAccess };
};

/**
 * Hook to get group context for display
 * Returns group names and display information
 */
export const useGroupContext = () => {
  const { user } = useAuth();
  const { accessibleGroups, getAccessDisplayText, permissionStatus } =
    useGroupAccess();

  return {
    isAdmin: permissionStatus.isAdmin,
    isRestricted: permissionStatus.isRestricted,
    accessibleGroupCount: permissionStatus.accessibleGroupCount,
    accessibleGroups,
    displayText: getAccessDisplayText(),
  };
};
