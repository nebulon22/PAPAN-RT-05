const CACHE_NAME = 'rt-kayen-v1.8.8'; // 🌟 Naikkan versi agar HP warga memperbarui SW

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

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

// 🌟 MENANGANI PESAN LATAR BELAKANG FCM & APP BADGE SAAT PWA TERTUTUP/MINIMIZE
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const notif = payload.notification || {};

  const title = data.title || notif.title || 'RT 05 Kayen';
  const body = data.body || notif.body || 'Anda menerima pesan baru.';
  const url = data.url || notif.click_action || './index.html';
  const count = data.unreadCount ? parseInt(data.unreadCount, 10) : 1;
  const notifMode = data.mode || 'normal';

  // 1. Pasang angka badge di ikon PWA layar utama HP
  if (self.navigator && 'setAppBadge' in self.navigator) {
    self.navigator.setAppBadge(count).catch(() => {});
  }

  // 2. Jika payload dari server sudah membawa blok "notification", browser otomatis menampilkannya
  // Jika payload hanya membawa blok "data" (data-only), kita tampilkan manual agar tidak ganda:
if (!payload.notification) {
    const options = {
      body: body,
      icon: './kentongan-slit-drum.png',
      badge: './kentongan-slit-drum.png',
      tag: data.tag || 'grup-chat-rt05',
      renotify: true,
      data: { url: url }
    };

    if (notifMode === 'sunyi' || notifMode === 'silent') {
      options.silent = true;
    } else if (notifMode === 'suara') {
      options.silent = false;
      // Tanpa options.vibrate karena warga memilih "Hanya Suara"
    } else {
      // Untuk mode 'normal' (Suara & Getar) maupun 'getar' (Hanya Getar)
      options.silent = false;
      options.vibrate = [18, 40, 18, 45, 32];
    }

    return self.registration.showNotification(title, options);
  }
});

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Unduh file audio secara latar belakang tanpa memblokir proses update utama
      const audioFiles = [
        './audio/bell2.mp3', './audio/bell3.mp3',
        './audio/bubble1.mp3', './audio/bubble2.mp3', './audio/bubble3.mp3', './audio/bubble4.mp3',
        './audio/cring1.mp3', './audio/cring2.mp3',
        './audio/kling1.mp3', './audio/kling2.mp3', './audio/kling3.mp3',
        './audio/ping1.mp3', './audio/ping2.mp3'
      ];
      cache.addAll(audioFiles).catch(() => {});

      // Daftar file inti aplikasi
      const coreFiles = [
        './',
        './index.html',
        './admin.html',
        './chat.html',
        './pengumuman.html',
        './cetak-qr.html',
        './utils.js',
        './setting.js',
        './manifest.json',
        './all.min.css',
        './leaflet.css',
        './leaflet.js',
        './leaflet.markercluster.js',
        './MarkerCluster.css',
        './MarkerCluster.Default.css',
        './kentongan192.png',
        './kentongan-slit-drum.png',
        './kentongan-btn.webp',
        './html5-qrcode.min.js'
      ];

      // Paksa browser melewati disk cache agar selalu menarik file terbaru dari server
      return Promise.all(
        coreFiles.map((url) => cache.add(new Request(url, { cache: 'reload' })))
      );
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

// Handling Fetch Event
// Handling Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass total untuk request non-GET (POST upload, simpan database, login, dll)
  if (event.request.method !== 'GET') {
    return;
  }

  // 2. Bypass Request Video/Audio (Range Requests)
  if (event.request.headers.has('range')) {
    return;
  }

  // 3. BYPASS TOTAL UNTUK CLOUDFLARE WORKERS & SUBDOMAIN API (Custom Domain & workers.dev)
if (
    url.hostname.includes('workers.dev') ||
    url.hostname === 'peta.papan05.my.id' ||
    url.hostname === 'uploader.papan05.my.id' ||
    url.hostname === 'admin-worker.papan05.my.id' ||
    url.hostname === 'fcm-worker.papan05.my.id'
  ) {
    return;
  }
  // 4. Longgarkan tangkapan untuk API, Firebase, Cloudflare R2 Storage, dan Media Eksternal
  if (
    event.request.mode === 'navigate' ||
    url.origin.includes('firebase') ||
    url.origin.includes('gstatic') ||
    url.origin.includes('firebasestorage') ||
    url.origin.includes('catbox.moe') ||
    url.origin.includes('storage.papan05.my.id') ||
    url.origin.includes('r2.dev') ||
    url.pathname.match(/\.(mp4|webm|jpg|jpeg|png|gif|webp)$/i)
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

  // 5. Cache First untuk aset statis UI PWA
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
// 1. Wajib ada agar tombol "Ada update nih!" langsung mengaktifkan SW baru
self.addEventListener('message', (event) => {
  if (event.data && (event.data.action === 'skipWaiting' || event.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});

// Klik pada notifikasi akan membuka/fokus kembali ke aplikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Bersihkan angka badge pada ikon PWA saat notifikasi diklik
  if (self.navigator && 'clearAppBadge' in self.navigator) {
    self.navigator.clearAppBadge().catch(() => {});
  }

  const targetUrl = event.notification.data?.url || './index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
