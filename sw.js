const CACHE_NAME = 'rt-kayen-v1.5.7'; 

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


self.addEventListener('push', (event) => {
  let data = { title: 'Pesan Baru', body: 'Anda menerima pesan baru.', mode: 'normal' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const title = data.title || 'RT 05 Kayen';
  
  // Tentukan perilaku berdasarkan mode dari pengaturan user (normal, sound_only, vibrate_only, silent)
  const notifMode = data.mode || 'normal'; 
  
  const options = {
    body: data.body || 'Anda menerima pesan baru.',
    icon: './kentongan-slit-drum.png',
    badge: './kentongan-slit-drum.png',
    data: {
      url: data.url || './index.html',
      dateOfArrival: Date.now(),
      primaryKey: '1'
    }
  };

  // Konfigurasi dinamis berdasarkan pilihan di UI Pengaturan Notifikasi:
  if (notifMode === 'silent') {
    options.silent = true;
    // Tidak ada vibrate karena silent
  } else if (notifMode === 'sound_only') {
    options.silent = false;
    // Tidak pakai vibrate, hanya suara bawaan / default
  } else if (notifMode === 'vibrate_only') {
    options.silent = true; // Agar tidak bentrok, set silent true tapi jalankan getar manual lewat setelan lain jika didukung, atau:
    options.vibrate = [100, 50, 100];
  } else {
    // Mode Normal (Suara & Getar)
    options.silent = false;
    options.vibrate = [100, 50, 100];
  }

  const count = data.unreadCount ? parseInt(data.unreadCount, 10) : 1;

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      
      (async () => {
        if ('setAppBadge' in navigator) {
          try {
            await navigator.setAppBadge(count);
          } catch (err) {
            console.log('Gagal memperbarui app badge:', err);
          }
        }
      })()
    ])
  );
});

// Klik pada notifikasi akan membuka/fokus kembali ke aplikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./index.html');
      }
    })
  );
});
