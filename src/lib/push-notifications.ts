// Helper to send push notifications from components after successful inserts

export async function sendPushNotification({
    author,
    title,
    body,
    url,
    tag,
}: {
    author: string;
    title: string;
    body: string;
    url?: string;
    tag?: string;
}) {
    try {
        await fetch("/api/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ author, title, body, url, tag }),
        });
    } catch {
        // Silent fail — notifications are best-effort
    }
}

// Register service worker & subscribe to push
export async function registerAndSubscribe(authorName: string): Promise<boolean> {
    try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            console.log("Push not supported");
            return false;
        }

        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidKey) return false;

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
            });
        }

        // Save subscription to server
        const res = await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                subscription: subscription.toJSON(),
                author: authorName,
            }),
        });

        return res.ok;
    } catch (err) {
        console.error("Push registration error:", err);
        return false;
    }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
