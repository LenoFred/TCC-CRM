/**
 * GroupSelector Component
 * A reusable dropdown selector for selecting groups
 * Pre-filters to user's accessible groups when user is restricted
 */

import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGroupAccess } from '@/hooks/useGroupAccess';
import { useAuth } from '@/contexts/AuthContext';

interface GroupSelectorProps {
  value?: string;
  onChange?: (groupId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  isLoading?: boolean;
  allGroups?: Array<{ id: string; name: string }>;
}

/**
 * GroupSelector component
 * Automatically filters to accessible groups for restricted staff
 * Shows all groups for admins
 *
 * Usage:
 * const [selectedGroup, setSelectedGroup] = useState('');
 * <GroupSelector value={selectedGroup} onChange={setSelectedGroup} label="Select Group" />
 */
export const GroupSelector: React.FC<GroupSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Select a group...',
  disabled = false,
  required = false,
  label,
  error,
  isLoading = false,
  allGroups = [],
}) => {
  const { getAccessibleGroupNames, userIsRestricted, accessibleGroups } = useGroupAccess();
  const [selectableGroups, setSelectableGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    const loadGroups = async () => {
      setLoadingGroups(true);
      try {
        // If custom groups provided, use those
        if (allGroups && allGroups.length > 0) {
          // Filter by accessible groups if user is restricted
          if (userIsRestricted && accessibleGroups) {
            const filtered = allGroups.filter((g) =>
              accessibleGroups.includes(g.id)
            );
            setSelectableGroups(filtered);
          } else {
            setSelectableGroups(allGroups);
          }
        } else {
          // Otherwise fetch accessible groups
          const groups = await getAccessibleGroupNames();
          setSelectableGroups(groups);
        }
      } catch (error) {
        console.error('Error loading groups:', error);
        setSelectableGroups([]);
      } finally {
        setLoadingGroups(false);
      }
    };

    loadGroups();
  }, [allGroups, userIsRestricted, accessibleGroups, getAccessibleGroupNames]);

  const isDisabled = disabled || isLoading || loadingGroups;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Select
        value={value || ''}
        onValueChange={(groupId) => onChange?.(groupId)}
        disabled={isDisabled}
      >
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {loadingGroups ? (
            <div className="p-2 text-sm text-muted-foreground">Loading groups...</div>
          ) : selectableGroups.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              {userIsRestricted
                ? 'No groups accessible to you'
                : 'No groups available'}
            </div>
          ) : (
            selectableGroups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {userIsRestricted && selectableGroups.length > 0 && (
        <p className="text-xs text-blue-600">
          Showing {selectableGroups.length} group{selectableGroups.length !== 1 ? 's' : ''} you have access to
        </p>
      )}
    </div>
  );
};

/**
 * Multi-select version of GroupSelector (if needed)
 * For selecting multiple groups at once
 */
export const GroupMultiSelector: React.FC<
  Omit<GroupSelectorProps, 'value' | 'onChange'> & {
    values?: string[];
    onChange?: (groupIds: string[]) => void;
  }
> = ({
  values = [],
  onChange,
  placeholder = 'Select groups...',
  disabled = false,
  required = false,
  label,
  error,
  isLoading = false,
  allGroups = [],
}) => {
  const { getAccessibleGroupNames, userIsRestricted, accessibleGroups } = useGroupAccess();
  const [selectableGroups, setSelectableGroups] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        if (allGroups && allGroups.length > 0) {
          if (userIsRestricted && accessibleGroups) {
            const filtered = allGroups.filter((g) =>
              accessibleGroups.includes(g.id)
            );
            setSelectableGroups(filtered);
          } else {
            setSelectableGroups(allGroups);
          }
        } else {
          const groups = await getAccessibleGroupNames();
          setSelectableGroups(groups);
        }
      } catch (error) {
        console.error('Error loading groups:', error);
        setSelectableGroups([]);
      }
    };

    loadGroups();
  }, [allGroups, userIsRestricted, accessibleGroups, getAccessibleGroupNames]);

  const toggleGroup = (groupId: string) => {
    const newValues = values.includes(groupId)
      ? values.filter((id) => id !== groupId)
      : [...values, groupId];
    onChange?.(newValues);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {selectableGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {userIsRestricted ? 'No groups accessible to you' : 'No groups available'}
          </p>
        ) : (
          selectableGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => toggleGroup(group.id)}
              disabled={disabled || isLoading}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                values.includes(group.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {group.name}
            </button>
          ))
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default GroupSelector;
