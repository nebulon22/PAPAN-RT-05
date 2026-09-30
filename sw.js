const CACHE_NAME = 'rt-kayen-v1.4.9'; // <--- Naikkan versi saat update

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

// Izinkan navigasi halaman HTML, Firebase, dan Video Streaming berjalan langsung tanpa lewat Cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Abaikan navigasi HTML, Firebase, dan file Video Streaming dari Cache Storage
  if (
    event.request.mode === 'navigate' || 
    url.origin.includes('firebase') || 
    url.origin.includes('gstatic') ||
    url.pathname.endsWith('.webm') || 
    url.pathname.endsWith('.mp4') ||
    url.origin.includes('catbox.moe')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // PERBAIKAN: Tangkap error & pastikan selalu mengembalikan Response yang valid
        return caches.match(event.request).then((cached) => {
          return cached || new Response('', { status: 480, statusText: 'Network Bypassed' });
        });
      })
    );
    return;
  }

  // 2. Caching biasa untuk aset statis (CSS, JS, Gambar, Font) + Aman dari Error Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Ambil dari jaringan, dan jika gagal (terputus/CDN diblokir), tangkap dengan .catch()
      return fetch(event.request).catch(() => {
        return new Response('', { status: 480, statusText: 'Offline/Network Error' });
      });
    })
  );
});

// 3. Perintah skipWaiting dari lonceng
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
