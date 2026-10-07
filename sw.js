// --- 0. IMPOR FIREBASE UNTUK PUSH NOTIFICATION ---
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
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

// Menangani background push notification
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Menerima pesan background:', payload);
  
  const notificationTitle = payload.notification.title || 'Pesan Baru RT 05';
  const notificationOptions = {
    body: payload.notification.body || 'Ada pesan baru masuk.',
    icon: './kentongan-slit-drum.png',
    badge: './kentongan-slit-drum.png',
    tag: 'rt05-chat-notif',
    renotify: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// --- KODE ASLI SW.JS ANDA DI BAWAH INI ---
const CACHE_NAME = 'rt-kayen-v1.5.2'; // <--- Naikkan versi saat update

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

  // 1. Abaikan navigasi HTML, Firebase, dan file Video Streaming dari Cache Storage PWA
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

  // 2. Caching biasa untuk aset statis (CSS, JS, Gambar, Font) + Aman dari Error Network
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

// 3. Perintah skipWaiting dari lonceng
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
