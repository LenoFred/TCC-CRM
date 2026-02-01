/**
 * Cache Invalidation Service
 * Handles clearing IndexedDB cache and broadcasting refresh events
 * Ensures all components get fresh data after form ingestion
 */

import { eventEmitter } from './eventEmitter';
import { clearCacheForKeys } from './indexedDB';

export const cacheInvalidationService = {
  /**
   * Invalidate all member-related caches
   * Called after form ingestion completes
   */
  async invalidateMembersCaches(): Promise<void> {
    try {
      console.log('[CacheInvalidation] Clearing members-related caches...');

      // Clear IndexedDB cache for these endpoints
      const cachesToClear = [
        '/members', // Members list
        '/members?', // Members with params
        '/business/dashboard-stats', // Dashboard stats
        '/group-members', // Group members
        '/groups', // Groups (might show member counts)
        '/metrics', // Dashboard metrics
      ];

      // Clear each cache key
      for (const cacheKey of cachesToClear) {
        await clearCacheForKeys([cacheKey]);
      }

      console.log('[CacheInvalidation] Cache cleared successfully');

      // Emit event for components to refetch
      console.log('[CacheInvalidation] Broadcasting refresh event...');
      eventEmitter.emit('data-refresh', { type: 'all' });
    } catch (error) {
      console.error('[CacheInvalidation] Error clearing caches:', error);
      // Don't throw - cache clearing is not critical, emit event anyway
      eventEmitter.emit('data-refresh', { type: 'all' });
    }
  },

  /**
   * Invalidate only members cache
   */
  async invalidateMembersCache(): Promise<void> {
    try {
      await clearCacheForKeys(['/members', '/members?']);
      eventEmitter.emit('data-refresh', { type: 'members' });
    } catch (error) {
      console.error('[CacheInvalidation] Error clearing members cache:', error);
      eventEmitter.emit('data-refresh', { type: 'members' });
    }
  },

  /**
   * Invalidate only dashboard cache
   */
  async invalidateDashboardCache(): Promise<void> {
    try {
      await clearCacheForKeys(['/business/dashboard-stats', '/metrics']);
      eventEmitter.emit('data-refresh', { type: 'dashboard' });
    } catch (error) {
      console.error('[CacheInvalidation] Error clearing dashboard cache:', error);
      eventEmitter.emit('data-refresh', { type: 'dashboard' });
    }
  },

  /**
   * Invalidate only group members cache
   */
  async invalidateGroupMembersCache(): Promise<void> {
    try {
      await clearCacheForKeys(['/group-members']);
      eventEmitter.emit('data-refresh', { type: 'groupMembers' });
    } catch (error) {
      console.error('[CacheInvalidation] Error clearing group members cache:', error);
      eventEmitter.emit('data-refresh', { type: 'groupMembers' });
    }
  },
};

export default cacheInvalidationService;
