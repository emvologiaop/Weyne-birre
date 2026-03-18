// Handles SHOW_NOTIFICATION messages from the page and notification clicks
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, badge, tag, renotify } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        body, icon: icon || '/manifest-icon-192.maskable.png',
        badge: badge || '/manifest-icon-192.maskable.png',
        tag, renotify, vibrate: [200, 100, 200],
      })
    );
  }
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
