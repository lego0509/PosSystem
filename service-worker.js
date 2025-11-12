const CACHE_NAME = "pos-shared-cache-v1";
const OFFLINE_ASSETS = [
  "/",
  "/index.html",
  "/pos",
  "/pos.html",
  "/kds",
  "/kds.html",
  "/call",
  "/call.html",
  "/catalog",
  "/catalog.html",
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/src/styles/common.css",
  "/src/styles/pos.css",
  "/src/styles/kds.css",
  "/src/styles/call.css",
  "/src/styles/catalog.css",
  "/src/utils.js",
  "/src/data.js",
  "/src/pos.js",
  "/src/kds.js",
  "/src/call.js",
  "/src/catalog.js",
  "/src/storage.js",
  "/src/shared/catalogDefaults.js",
  "/src/register-sw.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cloned);
          });
          return response;
        })
        .catch(() => cached);
    })
  );
});
