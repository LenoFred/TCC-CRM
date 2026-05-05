/**
 * GroupAccessBadge Component
 * Displays user's group access status in a badge format
 * Shows "Full Access (Admin)" for admins or list of groups for restricted staff
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useGroupAccess } from '@/hooks/useGroupAccess';
import { useAuth } from '@/contexts/AuthContext';

interface GroupAccessBadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

/**
 * Badge component showing user's group access
 * Usage: <GroupAccessBadge /> or <GroupAccessBadge showLabel compact />
 */
export const GroupAccessBadge: React.FC<GroupAccessBadgeProps> = ({
  variant = 'secondary',
  className = '',
  showLabel = false,
  compact = false,
}) => {
  const { user } = useAuth();
  const { getAccessDisplayText, permissionStatus } = useGroupAccess();

  if (!user) {
    return (
      <Badge variant="destructive" className={className}>
        Not Authenticated
      </Badge>
    );
  }

  const displayText = getAccessDisplayText();
  const isAdmin = permissionStatus.isAdmin;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-medium">
          {compact ? 'Access:' : 'Group Access:'}
        </span>
      )}
      <Badge
        variant={isAdmin ? 'default' : variant}
        className={`${
          isAdmin
            ? 'bg-green-100 text-green-800 hover:bg-green-100'
            : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
        }`}
      >
        {compact
          ? permissionStatus.accessibleGroupCount > 0
            ? `${permissionStatus.accessibleGroupCount} Group${permissionStatus.accessibleGroupCount !== 1 ? 's' : ''}`
            : displayText
          : displayText}
      </Badge>
    </div>
  );
};

/**
 * Inline badge component for table cells or tight spaces
 * Compact version that fits in tables
 */
export const GroupAccessBadgeCompact: React.FC<Omit<GroupAccessBadgeProps, 'compact'>> = (props) => {
  return <GroupAccessBadge {...props} compact showLabel={false} />;
};

/**
 * Badge component for dashboard header
 * Full size with label, ideal for dashboard display
 */
export const GroupAccessBadgeLarge: React.FC<Omit<GroupAccessBadgeProps, 'showLabel' | 'compact'>> = (props) => {
  return <GroupAccessBadge {...props} showLabel={true} compact={false} />;
};

export default GroupAccessBadge;
