importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAkI4SYofXE5XGMc9Xjyw2ntlAz4Cmltws",
  authDomain: "mlakher-1cd41.firebaseapp.com",
  projectId: "mlakher-1cd41",
  messagingSenderId: "997739624789",
  appId: "1:997739624789:web:6edc42b5523a76939097dc",
  
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
