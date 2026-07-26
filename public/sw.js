const CACHE_PREFIX = 'pyphone-cache-';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX))
          .map((k) => caches.delete(k))
      );
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
        clients.forEach((c) => c.navigate(c.url));
      });
    })
  );
});
