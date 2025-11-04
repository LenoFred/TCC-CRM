// PWA Registration and Management

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export function registerServiceWorker(config?: ServiceWorkerConfig) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration);

          // Check for updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content available
                  console.log('[PWA] New content available; please refresh.');
                  
                  if (config?.onUpdate) {
                    config.onUpdate(registration);
                  }
                } else {
                  // Content cached for offline use
                  console.log('[PWA] Content cached for offline use.');
                  
                  if (config?.onSuccess) {
                    config.onSuccess(registration);
                  }
                }
              }
            };
          };
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
          
          if (config?.onError) {
            config.onError(error);
          }
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('[PWA] Service Worker unregistered');
      })
      .catch((error) => {
        console.error('[PWA] Service Worker unregistration failed:', error);
      });
  }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PWA] This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

// Show local notification
export function showNotification(title: string, options?: NotificationOptions) {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          ...options,
        });
      });
    }
  }
}

// Background sync for offline operations
export async function syncWhenOnline(tag: string) {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      console.log(`[PWA] Background sync registered: ${tag}`);
    } catch (error) {
      console.error('[PWA] Background sync registration failed:', error);
    }
  }
}

// Queue operations for background sync
export interface QueuedOperation {
  id: string;
  type: 'check-in' | 'guest-registration' | 'donation';
  data: any;
  timestamp: number;
  retryCount: number;
}

const QUEUE_KEY = 'tcc-crm-sync-queue';

export function queueOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>) {
  try {
    const queue = getQueue();
    const newOperation: QueuedOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    queue.push(newOperation);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    
    // Trigger background sync
    const syncTag = `sync-${operation.type}s`;
    syncWhenOnline(syncTag);
    
    return newOperation.id;
  } catch (error) {
    console.error('[PWA] Failed to queue operation:', error);
    return null;
  }
}

export function getQueue(): QueuedOperation[] {
  try {
    const queueData = localStorage.getItem(QUEUE_KEY);
    return queueData ? JSON.parse(queueData) : [];
  } catch (error) {
    console.error('[PWA] Failed to get queue:', error);
    return [];
  }
}

export function removeFromQueue(operationId: string) {
  try {
    const queue = getQueue();
    const updatedQueue = queue.filter((op) => op.id !== operationId);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('[PWA] Failed to remove from queue:', error);
  }
}

export function clearQueue() {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch (error) {
    console.error('[PWA] Failed to clear queue:', error);
  }
}

// Check online status
export function isOnline(): boolean {
  return navigator.onLine;
}

// Listen to online/offline events
export function onConnectionChange(callback: (isOnline: boolean) => void) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Check if app can be installed
export function canInstallPWA(): boolean {
  return 'BeforeInstallPromptEvent' in window;
}

// Prompt PWA installation
let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('[PWA] Install prompt available');
});

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.warn('[PWA] Install prompt not available');
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`[PWA] User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);
  
  deferredPrompt = null;
  return outcome === 'accepted';
}

// Cache management
export async function clearAppCache() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => caches.delete(cacheName))
    );
    console.log('[PWA] All caches cleared');
  }
}

export async function getCacheSize(): Promise<number> {
  if ('caches' in window && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}
