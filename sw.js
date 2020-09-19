const precache = 'precache-v1';

const precacheURLS = ['/'];

self.addEventListener("install", function(event) {
    event.waitUntil(
        caches.open(precache).then((cache) => cache.addAll(precacheURLS)).then(self.skipWaiting())
    )
});

self.addEventListener('fetch', event => {
  // Skip cross-origin requests, like those for Google Analytics.
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return caches.open("runtime").then(cache => {
          return fetch(event.request).then(response => {
            // Put a copy of the response in the runtime cache.
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          });
        })
      })
    );
  }
});