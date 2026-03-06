// Service Worker for Our Memories — Push Notifications & Offline Support

const CACHE_NAME = "our-memories-v1";
const OFFLINE_URL = "/offline.html";

// Assets to pre-cache on install
const PRECACHE_URLS = [
    "/",
    "/memories",
    "/secret-space",
    "/manifest.json",
    OFFLINE_URL,
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    // Clean up old caches
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch strategy: Network-first with cache fallback
self.addEventListener("fetch", (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== "GET") return;

    // Skip Supabase API calls & external URLs (don't cache dynamic data)
    const url = new URL(request.url);
    if (
        url.hostname.includes("supabase") ||
        url.hostname.includes("nominatim") ||
        url.pathname.startsWith("/api/")
    ) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Clone and cache successful responses
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Network failed → try cache
                return caches.match(request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;

                    // For navigation requests, show offline page
                    if (request.mode === "navigate") {
                        return caches.match(OFFLINE_URL);
                    }

                    return new Response("Offline", {
                        status: 503,
                        statusText: "Service Unavailable",
                    });
                });
            })
    );
});

self.addEventListener("push", (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch {
        data = {
            title: "Our Memories",
            body: event.data.text(),
            icon: "/icon-192.png",
        };
    }

    const options = {
        body: data.body || "Something new is waiting for you 💕",
        icon: data.icon || "/icon-192.png",
        badge: "/icon-192.png",
        vibrate: [100, 50, 100],
        tag: data.tag || "our-memories",
        renotify: true,
        data: {
            url: data.url || "/",
        },
    };

    event.waitUntil(
        self.registration.showNotification(data.title || "Our Memories", options)
    );
});

// When user clicks the notification, open the app
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/";

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
            // If app is already open, focus it
            for (const client of clients) {
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            // Otherwise open a new window
            return self.clients.openWindow(url);
        })
    );
});
