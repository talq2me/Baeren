self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    self.clients.claim();
    // Clear all caches on activation
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => caches.delete(cache))
            );
        })
    );
});

self.addEventListener('fetch', event => {
    // Network-only, no caching
    event.respondWith(
        fetch(event.request, { cache: 'no-store' })
    );
});