// Firebase Cloud Messaging Background Service Worker
// Automatically registered by browser to receive background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDajiWrUprx3OKZhvIHsVo5ownQodE3CCw",
  authDomain: "techgarments-a41d6.firebaseapp.com",
  projectId: "techgarments-a41d6",
  storageBucket: "techgarments-a41d6.firebasestorage.app",
  messagingSenderId: "950565030381",
  appId: "1:950565030381:web:96ab0f85f757feeb7dbfe4",
  measurementId: "G-06RK67L16F"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background push notification:', payload);

  const title = payload.notification?.title || payload.data?.title || 'TechGarments Notification';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'New message or order update received.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});
