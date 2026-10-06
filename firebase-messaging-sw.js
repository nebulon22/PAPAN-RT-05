// firebase-messaging-sw.js - Service Worker untuk Firebase Cloud Messaging
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

// Menangani background push notification saat aplikasi tertutup
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Menerima pesan background:', payload);
  
  const notificationTitle = payload.notification.title || 'Pesan Baru RT 05';
  const notificationOptions = {
    body: payload.notification.body || 'Ada pesan baru masuk.',
    icon: './kentongan-slit-drum.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
