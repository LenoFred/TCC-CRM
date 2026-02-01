// Stale-While-Revalidate Cache Strategy
// Provides instant responses from cache while fetching fresh data in background

import { getCachedResponse, getCachedResponseWithMetadata, cacheResponse } from './indexedDB';

export interface CacheStrategyOptions {
  maxAge?: number; // Cache TTL in milliseconds (default: 5 minutes)
  forceRefresh?: boolean; // Force fetch fresh data
  onRevalidate?: (fresh: any) => void; // Callback when fresh data arrives
}

/**
 * Stale-While-Revalidate Pattern
 * 
 * Flow:
 * 1. Check cache
 * 2. If cache hit (not expired) → Return cached + fetch fresh in background
 * 3. If cache expired or miss → Fetch fresh immediately
 * 4. Cache fresh response
 * 5. Notify listeners of update
 * 
 * Benefits:
 * - Instant page loads (from cache)
 * - Always fresh data (background revalidation)
 * - Graceful degradation (stale cache on network error)
 */
export async function staleWhileRevalidate<T>(
  endpoint: string,
  fetcher: () => Promise<T>,
  options: CacheStrategyOptions = {}
): Promise<T> {
  const {
    maxAge = 5 * 60 * 1000, // 5 minutes default
    forceRefresh = false,
    onRevalidate,
  } = options;

  // Force refresh - skip cache
  if (forceRefresh) {
    console.log(`[Cache] Force refresh: ${endpoint}`);
    const fresh = await fetcher();
    await cacheResponse(endpoint, fresh, maxAge);
    return fresh;
  }

  // Try to get from cache
  const cached = await getCachedResponseWithMetadata<T>(endpoint);

  if (!cached) {
    // Cache miss - fetch fresh
    console.log(`[Cache] Miss: ${endpoint}`);
    const fresh = await fetcher();
    await cacheResponse(endpoint, fresh, maxAge);
    return fresh;
  }

  // Check cache age
  const age = Date.now() - cached.timestamp;
  const isStale = age > maxAge;

  if (!isStale) {
    // Cache is fresh - return it and revalidate in background
    console.log(`[Cache] Hit (fresh): ${endpoint} (${Math.round(age / 1000)}s old)`);

    // Revalidate in background (don't await)
    if (navigator.onLine) {
      revalidateInBackground(endpoint, fetcher, maxAge, onRevalidate);
    }

    return cached.data;
  }

  // Cache is stale
  if (!navigator.onLine) {
    // Offline - return stale cache
    console.log(`[Cache] Hit (stale, offline): ${endpoint} (${Math.round(age / 1000)}s old)`);
    return cached.data;
  }

  // Online with stale cache - return stale and fetch fresh
  console.log(`[Cache] Hit (stale, revalidating): ${endpoint} (${Math.round(age / 1000)}s old)`);
  
  // Return stale immediately
  const staleData = cached.data;
  
  // Fetch fresh in background
  revalidateInBackground(endpoint, fetcher, maxAge, onRevalidate);
  
  return staleData;
}

/**
 * Revalidate cache in background
 */
async function revalidateInBackground<T>(
  endpoint: string,
  fetcher: () => Promise<T>,
  maxAge: number,
  onRevalidate?: (fresh: T) => void
): Promise<void> {
  try {
    console.log(`[Cache] 🔄 Revalidating: ${endpoint}`);
    const fresh = await fetcher();
    
    // Update cache
    await cacheResponse(endpoint, fresh, maxAge);
    
    console.log(`[Cache] ✅ Revalidated: ${endpoint}`);
    
    // Notify listeners
    if (onRevalidate) {
      onRevalidate(fresh);
    }
    
    // Dispatch global event for UI updates
    window.dispatchEvent(
      new CustomEvent('cache-revalidated', {
        detail: { endpoint, data: fresh },
      })
    );
  } catch (error) {
    console.error(`[Cache] ❌ Revalidation failed: ${endpoint}`, error);
    // Don't throw - revalidation failure shouldn't break the app
  }
}

/**
 * Cache-first strategy (for static assets)
 * Returns cache if available, fetches if not
 */
export async function cacheFirst<T>(
  endpoint: string,
  fetcher: () => Promise<T>,
  maxAge: number = 60 * 60 * 1000 // 1 hour default
): Promise<T> {
  const cached = await getCachedResponseWithMetadata<T>(endpoint);
  
  if (cached) {
    const age = Date.now() - cached.timestamp;
    console.log(`[Cache] Cache-first hit: ${endpoint} (${Math.round(age / 1000)}s old)`);
    return cached.data;
  }
  
  console.log(`[Cache] Cache-first miss: ${endpoint}`);
  const fresh = await fetcher();
  await cacheResponse(endpoint, fresh, maxAge);
  return fresh;
}

/**
 * Network-first strategy (for critical data)
 * Always tries network first, falls back to cache on error
 */
export async function networkFirst<T>(
  endpoint: string,
  fetcher: () => Promise<T>,
  maxAge: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> {
  if (!navigator.onLine) {
    // Offline - return cache
    const cached = await getCachedResponseWithMetadata<T>(endpoint);
    if (cached) {
      console.log(`[Cache] Network-first offline fallback: ${endpoint}`);
      return cached.data;
    }
    throw new Error('No cached data available offline');
  }
  
  try {
    console.log(`[Cache] Network-first: ${endpoint}`);
    const fresh = await fetcher();
    await cacheResponse(endpoint, fresh, maxAge);
    return fresh;
  } catch (error) {
    // Network error - try cache
    const cached = await getCachedResponseWithMetadata<T>(endpoint);
    if (cached) {
      console.log(`[Cache] Network-first error fallback: ${endpoint}`);
      return cached.data;
    }
    throw error;
  }
}

/**
 * Cache-only strategy (for offline-first)
 * Only returns cached data, never fetches
 */
export async function cacheOnly<T>(endpoint: string): Promise<T> {
  const cached = await getCachedResponseWithMetadata<T>(endpoint);
  if (cached) {
    console.log(`[Cache] Cache-only hit: ${endpoint}`);
    return cached.data;
  }
  throw new Error('No cached data available');
}

/**
 * Network-only strategy (no caching)
 * Always fetches fresh, never caches
 */
export async function networkOnly<T>(
  fetcher: () => Promise<T>
): Promise<T> {
  return fetcher();
}

/**
 * Listen to cache revalidation events
 */
export function onCacheRevalidated(
  callback: (event: CustomEvent<{ endpoint: string; data: any }>) => void
): () => void {
  const handler = (event: Event) => {
    callback(event as CustomEvent);
  };
  
  window.addEventListener('cache-revalidated', handler);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('cache-revalidated', handler);
  };
}

/**
 * Preload data into cache
 */
export async function preloadCache<T>(
  endpoint: string,
  fetcher: () => Promise<T>,
  maxAge: number = 5 * 60 * 1000
): Promise<void> {
  try {
    console.log(`[Cache] 📥 Preloading: ${endpoint}`);
    const data = await fetcher();
    await cacheResponse(endpoint, data, maxAge);
    console.log(`[Cache] ✅ Preloaded: ${endpoint}`);
  } catch (error) {
    console.error(`[Cache] ❌ Preload failed: ${endpoint}`, error);
    // Don't throw - preload failure shouldn't break the app
  }
}

/**
 * Preload multiple resources in parallel
 */
export async function preloadMultiple(
  resources: Array<{
    endpoint: string;
    fetcher: () => Promise<any>;
    maxAge?: number;
  }>
): Promise<void> {
  console.log(`[Cache] 📥 Preloading ${resources.length} resources...`);
  
  const results = await Promise.allSettled(
    resources.map((resource) =>
      preloadCache(resource.endpoint, resource.fetcher, resource.maxAge)
    )
  );
  
  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;
  
  console.log(`[Cache] ✅ Preloaded: ${succeeded} succeeded, ${failed} failed`);
}

/**
 * Invalidate specific cache entry
 */
export async function invalidateCache(endpoint: string): Promise<void> {
  console.log(`[Cache] 🗑️ Invalidating: ${endpoint}`);
  const { deleteByKey } = await import('./indexedDB');
  await deleteByKey('cache', endpoint);
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCachePattern(pattern: string | RegExp): Promise<number> {
  const { getFromStore, deleteByKey } = await import('./indexedDB');
  const cache = await getFromStore<any>('cache');
  
  const regex = typeof pattern === 'string' 
    ? new RegExp(pattern) 
    : pattern;
  
  let count = 0;
  for (const entry of cache) {
    if (regex.test(entry.url)) {
      await deleteByKey('cache', entry.url);
      count++;
    }
  }
  
  console.log(`[Cache] 🗑️ Invalidated ${count} entries matching: ${pattern}`);
  return count;
}
