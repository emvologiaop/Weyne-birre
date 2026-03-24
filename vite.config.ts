import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['robots.txt', 'apple-touch-icon.png', 'sw-notifications.js'],
        manifest: {
          name: 'Birr Tracker — Personal Finance',
          short_name: 'Birr Tracker',
          description: 'Track your money, budgets, and savings — works offline too.',
          theme_color: '#10b981',
          background_color: '#050505',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          categories: ['finance', 'productivity'],
          icons: [
            {
              src: 'https://img.icons8.com/fluency/512/money-bag.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: 'https://img.icons8.com/fluency/192/money-bag.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
          screenshots: [],
          shortcuts: [
            {
              name: 'Add Transaction',
              short_name: 'Add',
              description: 'Quickly add a new transaction',
              url: '/transactions?add=true',
            },
            {
              name: 'View Dashboard',
              short_name: 'Dashboard',
              url: '/',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
          // Cache strategies for different resource types
          runtimeCaching: [
            // Google Fonts — cache first
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // External images (icons8 logo etc) — stale while revalidate
            {
              urlPattern: /^https:\/\/img\.icons8\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'icons-cache',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            // Transparent textures — cache first
            {
              urlPattern: /^https:\/\/www\.transparenttextures\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'textures-cache',
                expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // Firebase API — network first with offline fallback
            {
              urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firestore-cache',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
          // Inject the custom SW notification handler
          importScripts: ['/sw-notifications.js'],
          // Skip waiting so updates apply immediately
          skipWaiting: true,
          clientsClaim: true,
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
