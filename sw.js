// KoneKA Service Worker for PWA
const CACHE_NAME = 'koneka-cache-v6';
const STATIC_ASSETS = [
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Caching assets during install failed:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  
  if (url.origin === self.location.origin) {
    // For navigation / HTML documents, always fetch fresh from network to guarantee users never see stale cached UI
    if (event.request.mode === 'navigate' || event.request.destination === 'document' || url.pathname.endsWith('index.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
      event.respondWith(
        fetch(event.request, { cache: 'no-cache' })
          .catch(() => caches.match('./index.html'))
      );
      return;
    }

    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && (url.pathname.endsWith('.png') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.json'))) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});
