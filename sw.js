const CACHE_NAME = 'rt-kayen-v1.5.9'; 

// 🌟 WAJIB: Impor Firebase Compat khusus untuk Service Worker agar background push FCM tidak macet
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Inisialisasi Firebase di dalam Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyCYbBVdgNRUw0BBiqMAoNgO0SPFhIhG2m8",
  authDomain: "papan05-21a56.firebaseapp.com",
  databaseURL: "https://papan05-21a56-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "papan05-21a56",
  storageBucket: "papan05-21a56.firebasestorage.app",
  messagingSenderId: "1068108426437",
  appId: "1:1068108426437:web:429a9b35b92d8622ab94ac"
});

const messaging = firebase.messaging();

// 🌟 PENTING: Tangkap pesan latar belakang secara langsung di Service Worker
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Menerima pesan background FCM:', payload);
  
  const title = payload.notification?.title || payload.data?.title || 'RT 05 Kayen';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'Anda menerima pesan baru.',
    icon: './kentongan-slit-drum.png',
    badge: './kentongan-slit-drum.png',
    vibrate: [100, 50, 100],
    data: {
      url: payload.notification?.click_action || payload.data?.url || './index.html'
    }
  };

  self.registration.showNotification(title, options);
});

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

  if (notifMode === 'silent') {
    options.silent = true;
  } else if (notifMode === 'sound_only') {
    options.silent = false;
  } else if (notifMode === 'vibrate_only') {
    options.silent = true;
    options.vibrate = [100, 50, 100];
  } else {
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
