import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker, showNotification } from './utils/pwa'
import { initializeDatabase } from './utils/indexedDB'

createRoot(document.getElementById("root")!).render(<App />);

// Initialize IndexedDB for offline storage
initializeDatabase().then((success) => {
  if (success) {
    console.log('✅ IndexedDB initialized successfully');
  } else {
    console.warn('⚠️ IndexedDB initialization failed - offline features may not work');
  }
});

// Register service worker for PWA functionality
registerServiceWorker({
  onSuccess: () => {
    console.log('✅ TCC CRM is now available offline!');
  },
  onUpdate: () => {
    console.log('🔄 New version available! Please refresh.');
    showNotification('Update Available', {
      body: 'A new version of TCC CRM is available. Please refresh to update.',
      tag: 'update-available',
    });
  },
  onError: (error) => {
    console.error('❌ Service Worker registration failed:', error);
  },
});
