// IndexedDB Wrapper for TCC CRM Offline Storage
// Provides structured storage for offline-first capabilities

const DB_NAME = 'tcc-crm-db';
const DB_VERSION = 1;

export interface CachedResponse<T = any> {
  url: string;
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: string;
  endpoint: string;
  method: string;
  data: any;
  token?: string;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: string;
}

// Object store definitions
const STORES = {
  members: 'memberID',
  donations: 'donationID',
  attendance: 'attendanceID',
  groups: 'groupID',
  gatherings: 'gatheringID',
  guests: 'guestID',
  volunteers: 'volunteerID',
  queue: 'id',
  cache: 'url',
} as const;

type StoreName = keyof typeof STORES;

/**
 * Open/Initialize IndexedDB
 */
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[IndexedDB] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[IndexedDB] Database opened successfully');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log('[IndexedDB] Upgrading database schema...');

      // Create object stores if they don't exist
      Object.entries(STORES).forEach(([storeName, keyPath]) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath });
          
          // Add indexes for common queries
          if (storeName === 'cache') {
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('expiresAt', 'expiresAt', { unique: false });
          }
          
          if (storeName === 'queue') {
            store.createIndex('status', 'status', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('resource', 'resource', { unique: false });
          }
          
          console.log(`[IndexedDB] Created object store: ${storeName}`);
        }
      });
    };
  });
}

/**
 * Generic function to add/update data in a store
 */
export async function saveToStore<T>(
  storeName: StoreName,
  data: T | T[]
): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    const items = Array.isArray(data) ? data : [data];

    for (const item of items) {
      store.put(item);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    console.log(`[IndexedDB] Saved ${items.length} item(s) to ${storeName}`);
  } catch (error) {
    console.error(`[IndexedDB] Error saving to ${storeName}:`, error);
    throw error;
  }
}

/**
 * Get all items from a store
 */
export async function getFromStore<T>(storeName: StoreName): Promise<T[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`[IndexedDB] Error reading from ${storeName}:`, error);
    throw error;
  }
}

/**
 * Get a single item by key
 */
export async function getByKey<T>(
  storeName: StoreName,
  key: string | number
): Promise<T | undefined> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`[IndexedDB] Error getting key ${key} from ${storeName}:`, error);
    throw error;
  }
}

/**
 * Delete an item by key
 */
export async function deleteByKey(
  storeName: StoreName,
  key: string | number
): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    store.delete(key);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    console.log(`[IndexedDB] Deleted key ${key} from ${storeName}`);
  } catch (error) {
    console.error(`[IndexedDB] Error deleting from ${storeName}:`, error);
    throw error;
  }
}

/**
 * Clear all data from a store
 */
export async function clearStore(storeName: StoreName): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    store.clear();

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    console.log(`[IndexedDB] Cleared store: ${storeName}`);
  } catch (error) {
    console.error(`[IndexedDB] Error clearing ${storeName}:`, error);
    throw error;
  }
}

/**
 * Cache API response with expiration
 */
export async function cacheResponse<T>(
  url: string,
  data: T,
  maxAge: number = 5 * 60 * 1000 // 5 minutes default
): Promise<void> {
  try {
    const cachedItem: CachedResponse<T> = {
      url,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + maxAge,
    };

    await saveToStore('cache', cachedItem);
    console.log(`[IndexedDB] Cached response: ${url} (expires in ${maxAge / 1000}s)`);
  } catch (error) {
    console.error('[IndexedDB] Error caching response:', error);
    // Don't throw - caching failure shouldn't break the app
  }
}

/**
 * Get cached API response (data only)
 */
export async function getCachedResponse<T>(
  url: string
): Promise<T | null> {
  try {
    const cached = await getByKey<CachedResponse<T>>('cache', url);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      console.log(`[IndexedDB] Cache expired: ${url}`);
      await deleteByKey('cache', url);
      return null;
    }

    const age = Math.round((Date.now() - cached.timestamp) / 1000);
    console.log(`[IndexedDB] Cache hit: ${url} (${age}s old)`);
    return cached.data;
  } catch (error) {
    console.error('[IndexedDB] Error getting cached response:', error);
    return null;
  }
}

/**
 * Get full cached response object with metadata (for stale-while-revalidate)
 */
export async function getCachedResponseWithMetadata<T>(
  url: string
): Promise<CachedResponse<T> | null> {
  try {
    const cached = await getByKey<CachedResponse<T>>('cache', url);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      console.log(`[IndexedDB] Cache expired: ${url}`);
      await deleteByKey('cache', url);
      return null;
    }

    return cached;
  } catch (error) {
    console.error('[IndexedDB] Error getting cached response:', error);
    return null;
  }
}

/**
 * Clean expired cache entries
 */
export async function cleanExpiredCache(): Promise<number> {
  try {
    const db = await openDatabase();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    const index = store.index('expiresAt');

    const now = Date.now();
    let deletedCount = 0;

    const request = index.openCursor(IDBKeyRange.upperBound(now));

    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          deletedCount++;
          cursor.continue();
        }
      };

      tx.oncomplete = () => {
        if (deletedCount > 0) {
          console.log(`[IndexedDB] Cleaned ${deletedCount} expired cache entries`);
        }
        resolve(deletedCount);
      };

      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('[IndexedDB] Error cleaning expired cache:', error);
    return 0;
  }
}

/**
 * Get database size estimate
 */
export async function getDatabaseSize(): Promise<{
  usage: number;
  quota: number;
  usageDetails?: Record<string, number>;
}> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        usageDetails: (estimate as any).usageDetails as Record<string, number> | undefined,
      };
    }

    return { usage: 0, quota: 0 };
  } catch (error) {
    console.error('[IndexedDB] Error getting storage estimate:', error);
    return { usage: 0, quota: 0 };
  }
}

/**
 * Delete entire database (use with caution)
 */
export async function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => {
      console.log('[IndexedDB] Database deleted');
      resolve();
    };

    request.onerror = () => {
      console.error('[IndexedDB] Error deleting database:', request.error);
      reject(request.error);
    };

    request.onblocked = () => {
      console.warn('[IndexedDB] Database deletion blocked - close all tabs');
    };
  });
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return 'indexedDB' in window && indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Initialize database on app start
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    if (!isIndexedDBAvailable()) {
      console.warn('[IndexedDB] IndexedDB not available in this browser');
      return false;
    }

    await openDatabase();
    
    // Clean expired cache on init
    await cleanExpiredCache();
    
    // Log storage info
    const { usage, quota } = await getDatabaseSize();
    const usageMB = (usage / (1024 * 1024)).toFixed(2);
    const quotaMB = (quota / (1024 * 1024)).toFixed(2);
    console.log(`[IndexedDB] Storage: ${usageMB}MB / ${quotaMB}MB`);

    return true;
  } catch (error) {
    console.error('[IndexedDB] Initialization failed:', error);
    return false;
  }
}

// Export store names for type safety
export { STORES };
export type { StoreName };
