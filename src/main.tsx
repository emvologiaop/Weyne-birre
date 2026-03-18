import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// ── Offline / online banner ──────────────────────────────────────────────────
function syncOfflineBanner() {
  let banner = document.getElementById('offline-banner');
  if (!navigator.onLine) {
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'offline-banner';
      banner.className = 'offline-banner';
      banner.textContent = '📴  You are offline — data may not be up to date';
      document.body.prepend(banner);
    }
  } else {
    banner?.remove();
  }
}
window.addEventListener('online', syncOfflineBanner);
window.addEventListener('offline', syncOfflineBanner);
syncOfflineBanner();

// ── PWA Service Worker ───────────────────────────────────────────────────────
registerSW({
  immediate: true,
  onNeedRefresh() {
    // Show a non-intrusive update prompt via sonner (will be picked up by App)
    const event = new CustomEvent('pwa-update-available');
    window.dispatchEvent(event);
  },
  onOfflineReady() {
    console.log('[PWA] App ready for offline use');
  },
});

// ── Render ───────────────────────────────────────────────────────────────────
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
