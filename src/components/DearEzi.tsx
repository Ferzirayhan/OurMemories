"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Send, X, MessageCircle, ChevronDown, ChevronUp, Trash2, Lock, Unlock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/admin-context";

const SECRET_CODE = "230898";
const LOCK_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface DearMessage {
    id: string;
    message: string;
    mood: string | null;
    reply: string | null;
    replied_at: string | null;
    author: string;
    is_read: boolean;
    created_at: string;
}

const GENTLE_PROMPTS = [
    "Lagi ngerasa apa sekarang?",
    "Cerita aja, aku dengerin...",
    "Tulis apa aja yang kamu rasain.",
    "Aku selalu di sini buat kamu.",
];

export function DearEzi() {
    const { isAdmin, authorName } = useAdmin();
    const [messages, setMessages] = useState<DearMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isWriting, setIsWriting] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [prompt, setPrompt] = useState(GENTLE_PROMPTS[0]);
    const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
    const [codeInput, setCodeInput] = useState("");
    const [unlockingId, setUnlockingId] = useState<string | null>(null);
    const [codeError, setCodeError] = useState(false);
    const [tick, setTick] = useState(0);
    const nowRef = useRef(Date.now());
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Update nowRef on every tick
    nowRef.current = Date.now();
    const now = nowRef.current;

    useEffect(() => {
        setPrompt(GENTLE_PROMPTS[Math.floor(Math.random() * GENTLE_PROMPTS.length)]);
    }, []);

    const fetchMessages = async () => {
        setLoading(false);
        const { data, error } = await supabase
            .from("dear_ezi")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching dear_ezi:", error);
            return;
        }
        if (data) setMessages(data);
    };

    useEffect(() => {
        fetchMessages();

        const channel = supabase
            .channel("dear-ezi-changes")
            .on(
                "postgres_changes" as any,
                { event: "*", table: "dear_ezi" },
                (payload: any) => {
                    if (payload.eventType === "INSERT") {
                        setMessages((prev) => {
                            if (prev.find((m) => m.id === payload.new.id)) return prev;
                            return [payload.new, ...prev];
                        });
                    } else if (payload.eventType === "UPDATE") {
                        setMessages((prev) =>
                            prev.map((m) => (m.id === payload.new.id ? payload.new : m))
                        );
                    } else if (payload.eventType === "DELETE") {
                        setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Silently mark unread messages as read when admin views
    useEffect(() => {
        if (isAdmin && messages.length > 0) {
            const unread = messages.filter((m) => !m.is_read);
            if (unread.length > 0) {
                unread.forEach((m) => {
                    supabase
                        .from("dear_ezi")
                        .update({ is_read: true })
                        .eq("id", m.id)
                        .then();
                });
            }
        }
    }, [isAdmin, messages]);

    const handleSubmit = async () => {
        if (!newMessage.trim()) return;
        setIsSubmitting(true);

        const optimistic: DearMessage = {
            id: `temp-${Date.now()}`,
            message: newMessage.trim(),
            mood: null,
            reply: null,
            replied_at: null,
            author: authorName,
            is_read: false,
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [optimistic, ...prev]);
        setNewMessage("");
        setIsWriting(false);

        const { data, error } = await supabase
            .from("dear_ezi")
            .insert({
                message: optimistic.message,
                author: authorName,
            })
            .select();

        if (error) {
            console.error("Error inserting:", error);
            setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        } else if (data) {
            setMessages((prev) =>
                prev.map((m) => (m.id === optimistic.id ? data[0] : m))
            );
            // No push notification — Ezi reads silently
        }

        setIsSubmitting(false);
    };

    const handleReply = async (messageId: string) => {
        if (!replyText.trim()) return;

        await supabase
            .from("dear_ezi")
            .update({
                reply: replyText.trim(),
                replied_at: new Date().toISOString(),
            })
            .eq("id", messageId);

        setReplyingTo(null);
        setReplyText("");
    };

    const handleDelete = async (id: string) => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        await supabase.from("dear_ezi").delete().eq("id", id);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (mins < 1) return "Baru aja";
        if (mins < 60) return `${mins} menit lalu`;
        if (hours < 24) return `${hours} jam lalu`;
        if (days < 7) return `${days} hari lalu`;
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    };

    // Countdown timer — re-render every minute for locked messages
    useEffect(() => {
        const hasLocked = isAdmin && messages.some((m) => {
            const age = now - new Date(m.created_at).getTime();
            return age < LOCK_DURATION_MS && !unlockedIds.has(m.id);
        });
        if (!hasLocked) return;
        const interval = setInterval(() => setTick((t) => t + 1), 60000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, messages, unlockedIds, tick]);

    const isMessageLocked = (msg: DearMessage): boolean => {
        if (!isAdmin) return false; // Ratih sees her own messages
        const age = now - new Date(msg.created_at).getTime();
        if (age >= LOCK_DURATION_MS) return false; // 24h passed
        if (unlockedIds.has(msg.id)) return false; // bypassed with code
        return true;
    };

    const getCountdown = (createdAt: string): string => {
        const unlockTime = new Date(createdAt).getTime() + LOCK_DURATION_MS;
        const remaining = unlockTime - now;
        if (remaining <= 0) return "Unlocked";
        const hours = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        return `${hours}j ${mins}m lagi`;
    };

    const handleCodeSubmit = (msgId: string) => {
        if (codeInput === SECRET_CODE) {
            setUnlockedIds((prev) => new Set(prev).add(msgId));
            setUnlockingId(null);
            setCodeInput("");
            setCodeError(false);
        } else {
            setCodeError(true);
            setTimeout(() => setCodeError(false), 1500);
        }
    };

    // Unread count for admin badge
    const unreadCount = messages.filter((m) => !m.is_read).length;

    return (
        <section className="w-full">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-6 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "var(--accent-soft)" }}
                    >
                        <Heart className="w-4 h-4" style={{ color: "var(--accent)" }} />
                    </div>
                    <div>
                        <h2
                            className="text-lg font-serif italic"
                            style={{ color: "var(--text-primary)" }}
                        >
                            {isAdmin ? "From Ratih's Heart" : "Dear Ezi"}
                            {isAdmin && unreadCount > 0 && (
                                <span
                                    className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-sans not-italic font-medium"
                                    style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                                >
                                    {unreadCount} new
                                </span>
                            )}
                        </h2>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {isAdmin
                                ? "Yang dia belum bisa bilang langsung"
                                : "Tempat kamu curhat sama aku"}
                        </p>
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                ) : (
                    <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                )}
            </motion.div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        {/* Write Button — Only for Ratih (non-admin) */}
                        {!isAdmin && !isWriting && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => {
                                    setIsWriting(true);
                                    setTimeout(() => textareaRef.current?.focus(), 100);
                                }}
                                className="w-full p-4 rounded-2xl border border-dashed mb-4 text-left transition-all hover:border-solid group"
                                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                            >
                                <div className="flex items-center gap-3">
                                    <MessageCircle className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-sm italic">{prompt}</span>
                                </div>
                            </motion.button>
                        )}

                        {/* Writing Form */}
                        <AnimatePresence>
                            {isWriting && !isAdmin && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mb-6 p-5 rounded-2xl border"
                                    style={{
                                        backgroundColor: "var(--card)",
                                        borderColor: "var(--border)",
                                    }}
                                >
                                    <p
                                        className="text-xs mb-3 italic"
                                        style={{ color: "var(--text-muted)" }}
                                    >
                                        Gapapa kalo belum bisa cerita langsung. Tulis di sini aja ya.
                                    </p>

                                    <textarea
                                        ref={textareaRef}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Tulis apa aja di sini..."
                                        rows={4}
                                        className="w-full bg-transparent text-sm resize-none outline-none placeholder:italic"
                                        style={{
                                            color: "var(--text-primary)",
                                            borderBottom: "1px solid var(--border)",
                                            paddingBottom: "12px",
                                        }}
                                    />

                                    <div className="flex justify-between items-center mt-3">
                                        <button
                                            onClick={() => {
                                                setIsWriting(false);
                                                setNewMessage("");
                                            }}
                                            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                                            style={{ color: "var(--text-muted)" }}
                                        >
                                            Batal
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!newMessage.trim() || isSubmitting}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-40"
                                            style={{
                                                backgroundColor: "var(--accent)",
                                                color: "#fff",
                                            }}
                                        >
                                            <Send className="w-3 h-3" />
                                            {isSubmitting ? "Mengirim..." : "Kirim ke Ezi"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Messages List */}
                        <div className="space-y-3">
                            {messages.length === 0 && !loading && (
                                <div className="text-center py-8">
                                    <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>
                                        {isAdmin
                                            ? "Ratih belum nulis apa-apa."
                                            : "Belum ada pesan. Kapan aja kamu mau cerita, tulis di sini ya."}
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, i) => {
                                const locked = isMessageLocked(msg);

                                return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="p-4 rounded-2xl border relative group"
                                    style={{
                                        backgroundColor: "var(--card)",
                                        borderColor: locked
                                            ? "var(--border)"
                                            : msg.reply
                                            ? "var(--accent-soft)"
                                            : "var(--border)",
                                    }}
                                >
                                    {/* Delete — admin only, unlocked only */}
                                    {isAdmin && !locked && (
                                        <button
                                            onClick={() => handleDelete(msg.id)}
                                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full"
                                            style={{ color: "var(--text-faint)" }}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}

                                    {locked ? (
                                        /* === LOCKED STATE === */
                                        <div>
                                            {/* Blurred preview */}
                                            <p
                                                className="text-sm leading-relaxed select-none"
                                                style={{
                                                    color: "var(--text-primary)",
                                                    filter: "blur(6px)",
                                                    userSelect: "none",
                                                }}
                                            >
                                                {msg.message}
                                            </p>

                                            {/* Lock info */}
                                            <div className="flex items-center gap-2 mt-3">
                                                <Lock className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                                                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                                                    Terbuka dalam {getCountdown(msg.created_at)}
                                                </span>
                                            </div>

                                            {/* Secret code unlock */}
                                            {unlockingId === msg.id ? (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mt-3 flex items-center gap-2"
                                                >
                                                    <input
                                                        type="password"
                                                        inputMode="numeric"
                                                        value={codeInput}
                                                        onChange={(e) => setCodeInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") handleCodeSubmit(msg.id);
                                                        }}
                                                        placeholder="Kode rahasia..."
                                                        autoFocus
                                                        className="flex-1 bg-transparent text-sm outline-none placeholder:italic px-3 py-1.5 rounded-lg border"
                                                        style={{
                                                            color: "var(--text-primary)",
                                                            borderColor: codeError ? "#ef4444" : "var(--border)",
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleCodeSubmit(msg.id)}
                                                        className="p-1.5 rounded-lg"
                                                        style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                                                    >
                                                        <Unlock className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setUnlockingId(null); setCodeInput(""); setCodeError(false); }}
                                                        className="p-1.5 rounded-lg"
                                                        style={{ color: "var(--text-muted)" }}
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </motion.div>
                                            ) : (
                                                <button
                                                    onClick={() => setUnlockingId(msg.id)}
                                                    className="mt-2 text-[11px] flex items-center gap-1 transition-colors"
                                                    style={{ color: "var(--accent)" }}
                                                >
                                                    <Unlock className="w-3 h-3" />
                                                    Buka sekarang
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        /* === UNLOCKED STATE === */
                                        <>
                                            {/* Message */}
                                            <p
                                                className="text-sm leading-relaxed whitespace-pre-wrap"
                                                style={{ color: "var(--text-primary)" }}
                                            >
                                                {msg.message}
                                            </p>

                                            {/* Timestamp */}
                                            <p
                                                className="text-[10px] mt-2"
                                                style={{ color: "var(--text-faint)" }}
                                            >
                                                {formatDate(msg.created_at)}
                                            </p>

                                            {/* Reply from Ezi */}
                                            {msg.reply && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="mt-3 pt-3 border-t"
                                                    style={{ borderColor: "var(--border)" }}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <div
                                                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                                            style={{ backgroundColor: "var(--accent-soft)" }}
                                                        >
                                                            <Heart
                                                                className="w-2.5 h-2.5"
                                                                style={{ color: "var(--accent)" }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <p
                                                                className="text-xs font-medium mb-0.5"
                                                                style={{ color: "var(--accent)" }}
                                                            >
                                                                Ezi
                                                            </p>
                                                            <p
                                                                className="text-sm leading-relaxed whitespace-pre-wrap"
                                                                style={{ color: "var(--text-secondary)" }}
                                                            >
                                                                {msg.reply}
                                                            </p>
                                                            {msg.replied_at && (
                                                                <p
                                                                    className="text-[10px] mt-1"
                                                                    style={{ color: "var(--text-faint)" }}
                                                                >
                                                                    {formatDate(msg.replied_at)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Reply Button — admin only, no existing reply */}
                                            {isAdmin && !msg.reply && replyingTo !== msg.id && (
                                                <button
                                                    onClick={() => setReplyingTo(msg.id)}
                                                    className="mt-2 text-[11px] flex items-center gap-1 transition-colors"
                                                    style={{ color: "var(--accent)" }}
                                                >
                                                    <MessageCircle className="w-3 h-3" />
                                                    Balas
                                                </button>
                                            )}

                                            {/* Reply Form — admin only */}
                                            {isAdmin && replyingTo === msg.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mt-3 pt-3 border-t"
                                                    style={{ borderColor: "var(--border)" }}
                                                >
                                                    <textarea
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        placeholder="Balas Ratih..."
                                                        rows={2}
                                                        autoFocus
                                                        className="w-full bg-transparent text-sm resize-none outline-none placeholder:italic"
                                                        style={{ color: "var(--text-primary)" }}
                                                    />
                                                    <div className="flex justify-end gap-2 mt-2">
                                                        <button
                                                            onClick={() => {
                                                                setReplyingTo(null);
                                                                setReplyText("");
                                                            }}
                                                            className="text-xs px-2 py-1 rounded-lg"
                                                            style={{ color: "var(--text-muted)" }}
                                                        >
                                                            Batal
                                                        </button>
                                                        <button
                                                            onClick={() => handleReply(msg.id)}
                                                            disabled={!replyText.trim()}
                                                            className="text-xs px-3 py-1 rounded-lg font-medium disabled:opacity-40"
                                                            style={{
                                                                backgroundColor: "var(--accent)",
                                                                color: "#fff",
                                                            }}
                                                        >
                                                            Kirim
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </>
                                    )}
                                </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
