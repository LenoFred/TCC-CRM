/**
 * useDataRefresh Hook
 * Custom hook for components to subscribe to cache invalidation events
 * Automatically triggers data refetch when form ingestion completes
 */

import { useEffect, useCallback } from 'react';
import { eventEmitter } from '@/utils/eventEmitter';

type RefreshType = 'members' | 'groupMembers' | 'dashboard' | 'all';

interface UseDataRefreshOptions {
  /**
   * Callback function to execute when refresh is triggered
   */
  onRefresh: () => void;

  /**
   * Which data types should trigger the refresh
   * Default: 'all' (any refresh event triggers the callback)
   */
  types?: RefreshType[];

  /**
   * Optional dependency array for the effect
   */
  dependencies?: any[];

  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Hook to subscribe to cache invalidation events
 *
 * Usage:
 * ```tsx
 * const MembersPage = () => {
 *   const fetchMembers = async () => {
 *     const response = await api.members.getAll();
 *     setMembers(response.data);
 *   };
 *
 *   useDataRefresh({
 *     onRefresh: fetchMembers,
 *     types: ['members', 'all'],
 *   });
 *
 *   useEffect(() => {
 *     fetchMembers();
 *   }, []);
 *
 *   return <div>{members.length} members</div>;
 * };
 * ```
 */
export const useDataRefresh = ({
  onRefresh,
  types = ['all'],
  dependencies = [],
  debug = false,
}: UseDataRefreshOptions): void => {
  const shouldRefresh = useCallback(
    (refreshType: RefreshType): boolean => {
      // If listening to 'all', always refresh
      if (types.includes('all')) return true;

      // Check if this refresh type matches what we're listening for
      return types.includes(refreshType);
    },
    [types]
  );

  useEffect(() => {
    // Create wrapper to check if we should refresh
    const handleRefresh = (data?: any) => {
      const refreshType = data?.type || 'all';

      if (debug) {
        console.log(
          `[useDataRefresh] Refresh event received: ${refreshType}, triggering: ${shouldRefresh(refreshType)}`
        );
      }

      if (shouldRefresh(refreshType)) {
        if (debug) {
          console.log('[useDataRefresh] Calling onRefresh callback');
        }
        try {
          onRefresh();
        } catch (error) {
          console.error('[useDataRefresh] Error in onRefresh callback:', error);
        }
      }
    };

    // Subscribe to refresh event
    const unsubscribe = eventEmitter.on('data-refresh', handleRefresh);

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [shouldRefresh, onRefresh, debug, ...dependencies]);
};

export default useDataRefresh;
