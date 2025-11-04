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
  
  if (event.tag === 'sync-check-ins') {
    event.waitUntil(syncCheckIns());
  }
  
  if (event.tag === 'sync-guest-registrations') {
    event.waitUntil(syncGuestRegistrations());
  }
  
  if (event.tag === 'sync-donations') {
    event.waitUntil(syncDonations());
  }
});

// Sync queued check-ins
async function syncCheckIns() {
  try {
    // Get queued check-ins from IndexedDB (to be implemented)
    console.log('[ServiceWorker] Syncing check-ins...');
    
    // This would fetch from IndexedDB and POST to API
    // For now, just log
    
    return Promise.resolve();
  } catch (error) {
    console.error('[ServiceWorker] Check-in sync failed:', error);
    throw error;
  }
}

// Sync queued guest registrations
async function syncGuestRegistrations() {
  try {
    console.log('[ServiceWorker] Syncing guest registrations...');
    return Promise.resolve();
  } catch (error) {
    console.error('[ServiceWorker] Guest registration sync failed:', error);
    throw error;
  }
}

// Sync queued donations
async function syncDonations() {
  try {
    console.log('[ServiceWorker] Syncing donations...');
    return Promise.resolve();
  } catch (error) {
    console.error('[ServiceWorker] Donation sync failed:', error);
    throw error;
  }
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
