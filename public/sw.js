// This is a basic service worker
const CACHE_NAME = 'zapgo-cache-v1';
const urlsToCache = [
    '/',
    '/styles/globals.css',
    // Add other assets and pages you want to cache
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request);
                }
            )
    );
});
