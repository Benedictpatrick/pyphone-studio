const CACHE_NAME = 'pyphone-studio-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg',
  '/logo.png',
  '/fonts/Inter-latin.woff2',
  '/fonts/FiraCode-latin.woff2'
];

// Install: cache static assets and fonts immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for local + CDN (network-first with cache fallback)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  if (request.method !== 'GET') return;

  // CDN resources (Pyodide WASM, packages): network-first, cache fallback
  if (url.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch(request).then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => {
          return cache.match(request);
        });
      })
    );
    return;
  }

  // Everything else: cache-first, then network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
          });
        }
        return response;
      }).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
