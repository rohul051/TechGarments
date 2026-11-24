// Firebase Cloud Messaging Background Service Worker
// Automatically registered by browser to receive background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCO9z-EeRxTMj6hzythA26TzS25g6oPS0I",
  authDomain: "techgarments-cdd93.firebaseapp.com",
  projectId: "techgarments-cdd93",
  storageBucket: "techgarments-cdd93.firebasestorage.app",
  messagingSenderId: "980261237573",
  appId: "1:980261237573:web:d3548687cde0fc94f2842c"
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
