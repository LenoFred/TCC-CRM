/* eslint-disable no-restricted-globals */
// TCC CRM Service Worker
// Provides offline support, caching, and background sync

const CACHE_NAME = 'tcc-crm-v1';
const RUNTIME_CACHE = 'tcc-crm-runtime-v1';
const API_CACHE = 'tcc-crm-api-v1';

// Static assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/robots.txt',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheToDelete);
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstStrategy(request, API_CACHE)
    );
    return;
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    cacheFirstStrategy(request, RUNTIME_CACHE)
  );
});

// Network-first strategy (good for API calls)
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Only cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network request failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Cache-first strategy (good for static assets)
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Fetch failed:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(processOfflineQueue());
  }
  
  // Legacy support for specific sync tags
  if (event.tag === 'sync-check-ins') {
    event.waitUntil(processOfflineQueue());
  }
  
  if (event.tag === 'sync-guest-registrations') {
    event.waitUntil(processOfflineQueue());
  }
  
  if (event.tag === 'sync-donations') {
    event.waitUntil(processOfflineQueue());
  }
});

// Open IndexedDB from service worker
async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tcc-crm-db', 1);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Process offline queue - main sync function
async function processOfflineQueue() {
  try {
    console.log('[ServiceWorker] 🔄 Starting offline queue sync...');
    
    const db = await openDatabase();
    const tx = db.transaction('queue', 'readonly');
    const store = tx.objectStore('queue');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = async () => {
        const queue = request.result || [];
        const pendingOps = queue.filter(op => op.status === 'pending');
        
        console.log(`[ServiceWorker] Found ${pendingOps.length} pending operations`);
        
        if (pendingOps.length === 0) {
          resolve();
          return;
        }
        
        let successCount = 0;
        let failCount = 0;
        
        // Process each operation
        for (const operation of pendingOps) {
          try {
            await syncOperation(operation);
            successCount++;
          } catch (error) {
            console.error(`[ServiceWorker] Failed to sync operation ${operation.id}:`, error);
            failCount++;
          }
        }
        
        console.log(`[ServiceWorker] ✅ Sync complete: ${successCount} succeeded, ${failCount} failed`);
        
        // Notify clients about sync completion
        await notifyClients({
          type: 'sync-complete',
          successCount,
          failCount,
        });
        
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[ServiceWorker] ❌ Queue processing failed:', error);
    throw error;
  }
}

// Sync a single operation
async function syncOperation(operation) {
  const API_BASE_URL = self.location.origin.includes('localhost')
    ? 'http://localhost:3001/api'
    : 'https://tcc-crm-backend.vercel.app/api';
  
  const url = `${API_BASE_URL}${operation.endpoint}`;
  
  console.log(`[ServiceWorker] 📤 Syncing: ${operation.method} ${operation.endpoint}`);
  
  try {
    // Update status to processing
    await updateOperationStatus(operation.id, 'processing');
    
    // Make API request
    const response = await fetch(url, {
      method: operation.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(operation.token && { 'Authorization': `Bearer ${operation.token}` }),
      },
      body: JSON.stringify(operation.data),
    });
    
    if (response.ok) {
      // Success - remove from queue
      await removeOperation(operation.id);
      console.log(`[ServiceWorker] ✅ Synced: ${operation.resource} ${operation.type}`);
      
      // Notify clients
      await notifyClients({
        type: 'operation-synced',
        operationId: operation.id,
        resource: operation.resource,
        operationType: operation.type,
      });
    } else {
      // Failed - increment retry count
      const errorData = await response.json().catch(() => ({}));
      const error = errorData.message || `HTTP ${response.status}`;
      
      const retryCount = await incrementRetryCount(operation.id, error);
      
      if (retryCount >= 3) {
        // Max retries exceeded - mark as failed
        await updateOperationStatus(operation.id, 'failed', error);
        console.log(`[ServiceWorker] ❌ Failed permanently: ${operation.id}`);
        
        await notifyClients({
          type: 'operation-failed',
          operationId: operation.id,
          error,
        });
      } else {
        // Reset to pending for retry
        await updateOperationStatus(operation.id, 'pending');
        console.log(`[ServiceWorker] ⚠️ Retry ${retryCount}/3: ${operation.id}`);
      }
    }
  } catch (error) {
    console.error(`[ServiceWorker] ❌ Sync error for ${operation.id}:`, error);
    
    const retryCount = await incrementRetryCount(operation.id, error.message);
    
    if (retryCount >= 3) {
      await updateOperationStatus(operation.id, 'failed', error.message);
    } else {
      await updateOperationStatus(operation.id, 'pending');
    }
    
    throw error;
  }
}

// Update operation status in IndexedDB
async function updateOperationStatus(operationId, status, error) {
  const db = await openDatabase();
  const tx = db.transaction('queue', 'readwrite');
  const store = tx.objectStore('queue');
  
  return new Promise((resolve, reject) => {
    const getRequest = store.get(operationId);
    
    getRequest.onsuccess = () => {
      const operation = getRequest.result;
      if (operation) {
        operation.status = status;
        if (error) {
          operation.error = error;
        }
        
        const putRequest = store.put(operation);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Increment retry count
async function incrementRetryCount(operationId, error) {
  const db = await openDatabase();
  const tx = db.transaction('queue', 'readwrite');
  const store = tx.objectStore('queue');
  
  return new Promise((resolve, reject) => {
    const getRequest = store.get(operationId);
    
    getRequest.onsuccess = () => {
      const operation = getRequest.result;
      if (operation) {
        operation.retryCount = (operation.retryCount || 0) + 1;
        if (error) {
          operation.error = error;
        }
        
        const putRequest = store.put(operation);
        putRequest.onsuccess = () => resolve(operation.retryCount);
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve(0);
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Remove operation from queue
async function removeOperation(operationId) {
  const db = await openDatabase();
  const tx = db.transaction('queue', 'readwrite');
  const store = tx.objectStore('queue');
  
  return new Promise((resolve, reject) => {
    const request = store.delete(operationId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Notify all clients
async function notifyClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach(client => {
    client.postMessage(message);
  });
}

// Legacy sync functions - now redirect to main queue processor
async function syncCheckIns() {
  return processOfflineQueue();
}

async function syncGuestRegistrations() {
  return processOfflineQueue();
}

async function syncDonations() {
  return processOfflineQueue();
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'tcc-crm-notification',
    requireInteraction: false,
  };
  
  event.waitUntil(
    self.registration.showNotification('TCC CRM', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Message handling from clients
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urlsToCache = event.data.payload;
    event.waitUntil(
      caches.open(RUNTIME_CACHE)
        .then((cache) => cache.addAll(urlsToCache))
    );
  }
});
