// Firebase Cloud Messaging Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// This background worker can be initialized using the same credentials as your app
// The config parameters will be intercepted or configured
firebase.initializeApp({
  apiKey: "placeholder_key",
  authDomain: "placeholder_auth",
  projectId: "placeholder_project",
  storageBucket: "placeholder_bucket",
  messagingSenderId: "placeholder_sender_id",
  appId: "placeholder_app_id"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano: ', payload);
  
  const notificationTitle = payload.notification.title || 'Recordatorio de Vacuna';
  const notificationOptions = {
    body: payload.notification.body || 'Tienes una vacuna pendiente para tu hijo.',
    icon: '/favicon.ico',
    badge: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
