const CACHE_NAME = 'rt-kayen-v1.5.2'; 

self.addEventListener('install', (e) => {
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

  if (
    event.request.mode === 'navigate' || 
    url.origin.includes('firebase') || 
    url.origin.includes('gstatic') ||
    url.pathname.endsWith('.webm') || 
    url.pathname.endsWith('.mp4') ||
    url.origin.includes('catbox.moe')
  ) {
    event.respondWith(
      fetch(event.request).catch((err) => {
        return caches.match(event.request).then((cached) => {
          return cached || new Response(null, { status: 404, statusText: 'Not Found' });
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).catch(() => {
        return new Response('', { status: 480, statusText: 'Offline/Network Error' });
      });
    })
  );
});

// Perintah skipWaiting dari lonceng
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
