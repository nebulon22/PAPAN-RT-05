const CACHE_NAME = 'rt-kayen-v1.4.6'; // <--- Naikkan versi di sini saat update

self.addEventListener('install', (e) => {
  // CATATAN: self.skipWaiting() Sengaja DIHAPUS dari sini 
  // agar lonceng tidak hilang otomatis sebelum diklik warga.
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './admin.html',
        './inventaris.html',
        './kentongan-slit-drum.png',
        './html5-qrcode.min.js'
      ]);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      self.clients.claim(),
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

// Izinkan navigasi halaman HTML & Firebase berjalan langsung tanpa lewat Cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Abaikan request navigasi HTML (seperti admin.html) & Firebase API
  if (event.request.mode === 'navigate' || url.origin.includes('firebase') || url.origin.includes('gstatic')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // 2. Caching biasa untuk aset statis (CSS, JS, Gambar, Font)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
