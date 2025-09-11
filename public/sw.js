// sw.js - ZapGo Rental PWA Service Worker

const CACHE_NAME = "zapgo-cache-v2";

// Cache essential assets (app shell)
const APP_SHELL = [
    "/",
    "/manifest.json",
    "/favicon.ico",
    "/logo-192.png",
    "/logo-512.png",
    "/styles/globals.css"
    // add more like fonts, hero images, etc. as needed
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(APP_SHELL);
        })
    );
});

// Clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
});

// Fetch handler: stale-while-revalidate
self.addEventListener("fetch", (event) => {
    const { request } = event;
    event.respondWith(
        caches.match(request).then((cached) => {
            const networkFetch = fetch(request)
                .then((res) => {
                    if (res && res.status === 200 && request.method === "GET") {
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, res.clone()));
                    }
                    return res;
                })
                .catch(() => cached); // fallback to cache if offline
            return cached || networkFetch;
        })
    );
});
