// Service Worker for Our Memories — Push Notifications

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
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
