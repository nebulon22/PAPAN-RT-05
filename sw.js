const CACHE_NAME = 'rt-kayen-v1.3.4'; // <--- Naikkan versinya tiap ada update!

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Paksa Service Worker baru langsung aktif
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './inventaris.html',
        './kentongan-slit-drum.png',
        './html5-qrcode.min.js'
      ]);
    })
  );
});

// Otomatis hapus cache versi lama di HP & ambil alih halaman aktif
self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      self.clients.claim(), // <--- Tambahan: Langsung kendalikan halaman yang aktif
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (e) => {
  // KHUSUS MANIFEST: Selalu ambil dari internet (Network-First)
  if (e.request.url.includes('manifest.json')) {
    e.respondWith(
      fetch(e.request)
        .catch(() => caches.match(e.request)) // Cadangan jika benar-benar offline
    );
    return;
  }

  // Untuk aset lainnya, tetap gunakan strategi cache Anda yang sekarang
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});

