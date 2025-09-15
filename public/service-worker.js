// Simple service worker for offline caching (basic PWA support)
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open('ikasilink-cache-v1').then(cache =>
      cache.match(event.request).then(response =>
        response || fetch(event.request).then(networkResponse => {
          if (event.request.method === 'GET' && networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
      )
    )
  );
});
