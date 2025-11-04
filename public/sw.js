// Service Worker for Push Notifications
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'UPSC Prep Academy';
  const options = {
    body: data.body || 'New notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: data.url || '/',
    vibrate: [200, 100, 200],
    tag: data.tag || 'upsc-notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
