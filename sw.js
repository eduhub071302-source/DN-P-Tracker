const CACHE_NAME = "dnp-tracker-v13";
const urlsToCache = [
  "./",
  "./index.html",
  "./admin.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css",
];

// Install a service worker
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Force the waiting SW to become active immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    }),
  );
});

// Update a service worker (Fixed the whitelist bug that was deleting your cache)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete ANY cache that isn't our current version
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Cache and return requests (Network First strategy for GitHub Pages)
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If network fetch is successful, clone it and update the cache
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails (offline), fallback to cache
        return caches.match(event.request);
      }),
  );
});
