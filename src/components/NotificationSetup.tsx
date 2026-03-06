"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, X } from "lucide-react";
import { useAdmin } from "@/lib/admin-context";
import { registerAndSubscribe } from "@/lib/push-notifications";

export function NotificationSetup() {
    const { authorName } = useAdmin();
    const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
    const [showPrompt, setShowPrompt] = useState(false);
    const [subscribing, setSubscribing] = useState(false);
    const [subscribed, setSubscribed] = useState(false);

    useEffect(() => {
        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
            setPermission("unsupported");
            return;
        }

        setPermission(Notification.permission);

        // If already granted, silently register
        if (Notification.permission === "granted") {
            registerAndSubscribe(authorName).then((ok) => {
                if (ok) setSubscribed(true);
            });
            return;
        }

        // Show prompt after 3 seconds if not yet asked
        if (Notification.permission === "default") {
            const timer = setTimeout(() => setShowPrompt(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [authorName]);

    const handleEnable = async () => {
        setSubscribing(true);
        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === "granted") {
                const ok = await registerAndSubscribe(authorName);
                setSubscribed(ok);
            }
        } catch (err) {
            console.error("Notification permission error:", err);
        } finally {
            setSubscribing(false);
            setShowPrompt(false);
        }
    };

    // Don't render anything if already subscribed, denied, or unsupported
    if (permission === "unsupported" || permission === "denied" || subscribed) {
        return null;
    }

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[200] p-5 rounded-2xl border shadow-2xl"
                    style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                >
                    <button
                        onClick={() => setShowPrompt(false)}
                        className="absolute top-3 right-3 p-1 rounded-full transition-colors"
                        style={{ color: 'var(--text-faint)' }}
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--accent-soft)' }}>
                            <Bell className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                Stay Connected 💕
                            </h4>
                            <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
                                Get notified when {authorName === "Ezi" ? "Ratih" : "Ezi"} adds something new — memories, love notes, and more.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleEnable}
                                    disabled={subscribing}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                                    style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                                >
                                    {subscribing ? "Setting up..." : "Enable Notifications"}
                                </button>
                                <button
                                    onClick={() => setShowPrompt(false)}
                                    className="px-3 py-2.5 rounded-xl text-xs transition-colors"
                                    style={{ color: 'var(--text-muted)', backgroundColor: 'var(--glass-bg)' }}
                                >
                                    Later
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
