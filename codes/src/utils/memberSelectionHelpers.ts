/**
 * Member/Recipient Selection Utilities
 * Provides helper functions for filtering members and recipients by group access
 * Used throughout the app for selecting contacts, assigning roles, etc.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useGroupAccess } from '@/hooks/useGroupAccess';

interface Member {
  memberID: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  [key: string]: any;
}

interface GroupMember {
  memberID: string;
  groupID: string;
  [key: string]: any;
}

/**
 * Hook for member selection with group access
 * Automatically filters members based on user's group permissions
 *
 * @returns Object with filtered members and helper functions
 */
export const useMemberSelection = () => {
  const { user } = useAuth();
  const { userIsRestricted, accessibleGroups } = useGroupAccess();

  /**
   * Filter members by group access
   * Admin sees all members, restricted staff see only their group members
   */
  const filterMembersByAccess = (
    members: Member[],
    groupMembers: GroupMember[]
  ): Member[] => {
    if (!userIsRestricted || !accessibleGroups) {
      return members; // Admin sees all members
    }

    if (!accessibleGroups || accessibleGroups.length === 0) {
      return []; // No groups = no access
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
   * Get member display name
   */
  const getMemberDisplayName = (member: Member): string => {
    const firstName = member.firstName || '';
    const lastName = member.lastName || '';
    const name = `${firstName} ${lastName}`.trim();
    return name || member.memberID || 'Unknown';
  };

  /**
   * Format member for display (name + email/phone)
   */
  const formatMemberForDisplay = (member: Member): string => {
    const name = getMemberDisplayName(member);
    const contact = member.email || member.phoneNumber || '';
    return contact ? `${name} (${contact})` : name;
  };

  /**
   * Get members sorted by name
   */
  const getSortedMembers = (members: Member[]): Member[] => {
    return [...members].sort((a, b) => {
      const nameA = getMemberDisplayName(a).toLowerCase();
      const nameB = getMemberDisplayName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  /**
   * Check if user can select a specific member
   */
  const canSelectMember = (
    memberId: string,
    groupMembers: GroupMember[]
  ): boolean => {
    if (!userIsRestricted || !accessibleGroups) {
      return true; // Admin can select anyone
    }

    if (!accessibleGroups || accessibleGroups.length === 0) {
      return false; // No groups = can't select anyone
    }

    // Check if member is in accessible groups
    return groupMembers.some(
      (gm) =>
        gm.memberID === memberId && accessibleGroups.includes(gm.groupID)
    );
  };

  return {
    filterMembersByAccess,
    getMemberDisplayName,
    formatMemberForDisplay,
    getSortedMembers,
    canSelectMember,
    userIsRestricted,
    accessibleGroups,
  };
};

/**
 * Hook for recipient selection in communications
 * Filters recipients (members, groups) by group access
 */
export const useRecipientSelection = () => {
  const { user } = useAuth();
  const { userIsRestricted, accessibleGroups, getAccessibleGroupNames } = useGroupAccess();

  /**
   * Get accessible groups for recipient selection
   */
  const getAccessibleGroups = async () => {
    if (!userIsRestricted || !accessibleGroups) {
      return []; // Return empty - let parent component handle showing all groups
    }

    if (!accessibleGroups || accessibleGroups.length === 0) {
      return [];
    }

    return accessibleGroups;
  };

  /**
   * Validate if user can send to a group
   */
  const canSendToGroup = (groupId: string): boolean => {
    if (!userIsRestricted || !accessibleGroups) {
      return true; // Admin can send to any group
    }

    if (!accessibleGroups || accessibleGroups.length === 0) {
      return false; // No groups = can't send
    }

    return accessibleGroups.includes(groupId);
  };

  /**
   * Validate if user can send to a member
   */
  const canSendToMember = (
    memberId: string,
    groupMembers: GroupMember[]
  ): boolean => {
    if (!userIsRestricted || !accessibleGroups) {
      return true; // Admin can send to anyone
    }

    if (!accessibleGroups || accessibleGroups.length === 0) {
      return false; // No groups = can't send
    }

    // Check if member is in accessible groups
    return groupMembers.some(
      (gm) =>
        gm.memberID === memberId && accessibleGroups.includes(gm.groupID)
    );
  };

  /**
   * Filter recipients by group access
   */
  const filterRecipients = (
    recipients: string[], // Array of memberID or groupID
    members: Member[],
    groups: Array<{ id: string; name: string }>,
    groupMembers: GroupMember[]
  ) => {
    if (!userIsRestricted || !accessibleGroups) {
      return recipients; // Admin sees all
    }

    if (!accessibleGroups || accessibleGroups.length === 0) {
      return []; // No groups = no recipients
    }

    const accessibleMemberIds = new Set(
      groupMembers
        .filter((gm) => accessibleGroups.includes(gm.groupID))
        .map((gm) => gm.memberID)
    );

    return recipients.filter((id) => {
      // Check if it's a member ID or group ID
      if (accessibleMemberIds.has(id)) return true;
      if (accessibleGroups.includes(id)) return true;
      return false;
    });
  };

  return {
    getAccessibleGroups,
    canSendToGroup,
    canSendToMember,
    filterRecipients,
    userIsRestricted,
  };
};

/**
 * Utility function to validate member selection
 * Checks if user has permission to assign/manage a member
 */
export const validateMemberAccess = (
  memberId: string,
  groupMembers: GroupMember[],
  userGroupPermissions: string[] | null | undefined
): boolean => {
  // Admin has full access
  if (userGroupPermissions === null || userGroupPermissions === undefined) {
    return true;
  }

  // Empty array = full access
  if (!Array.isArray(userGroupPermissions) || userGroupPermissions.length === 0) {
    return true;
  }

  // Check if member is in user's accessible groups
  return groupMembers.some(
    (gm) =>
      gm.memberID === memberId &&
      userGroupPermissions.includes(gm.groupID)
  );
};

/**
 * Utility function to get selectable members based on context
 * Used for dropdown options, list filtering, etc.
 */
export const getSelectableMembers = (
  allMembers: Member[],
  groupMembers: GroupMember[],
  userGroupPermissions: string[] | null | undefined
): Member[] => {
  // Admin sees all members
  if (userGroupPermissions === null || userGroupPermissions === undefined) {
    return allMembers;
  }

  // Empty array = full access
  if (!Array.isArray(userGroupPermissions) || userGroupPermissions.length === 0) {
    return allMembers;
  }

  // Filter to accessible group members
  const accessibleMemberIds = new Set(
    groupMembers
      .filter((gm) => userGroupPermissions.includes(gm.groupID))
      .map((gm) => gm.memberID)
  );

  return allMembers.filter((m) => accessibleMemberIds.has(m.memberID));
};
