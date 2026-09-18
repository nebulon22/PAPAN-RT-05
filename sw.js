const CACHE_NAME = 'jimpitan-app-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Paksa Service Worker baru langsung aktif
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './kentongan-slit-drum.png'
      ]);
    })
  );
});

// Otomatis hapus cache versi lama di HP
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
