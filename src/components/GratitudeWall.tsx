"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flower2, Plus, Send, X, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/admin-context";
import { sendPushNotification } from "@/lib/push-notifications";

interface GratitudeNote {
    id: string;
    message: string;
    author: string;
    created_at: string;
}

const STICKY_COLORS = [
    "#FEF9C3", // warm yellow
    "#FECDD3", // soft pink
    "#D1FAE5", // mint green
    "#DBEAFE", // light blue
    "#EDE9FE", // lavender
    "#FED7AA", // peach
    "#FBCFE8", // rose
    "#CCFBF1", // teal
];

const PIN_COLORS = [
    "from-red-300 to-red-500",
    "from-blue-300 to-blue-500",
    "from-amber-300 to-amber-500",
    "from-emerald-300 to-emerald-500",
    "from-violet-300 to-violet-500",
    "from-pink-300 to-pink-500",
];

const FLOWERS = ["🌸", "🌷", "🌺", "🌻", "💮", "🌼", "🌹", "🪻"];

function getNoteStyle(idx: number) {
    const seed = ((idx * 7919 + 104729) % 100) / 100;
    const rotation = seed * 6 - 3; // -3 to 3 degrees
    const color = STICKY_COLORS[idx % STICKY_COLORS.length];
    const pinColor = PIN_COLORS[idx % PIN_COLORS.length];
    const flower = FLOWERS[idx % FLOWERS.length];
    return { rotation, color, pinColor, flower };
}

export function GratitudeWall() {
    const { isAdmin, authorName } = useAdmin();
    const [notes, setNotes] = useState<GratitudeNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchNotes();

        const channel = supabase
            .channel("gratitude-changes")
            .on(
                "postgres_changes" as any,
                { event: "*", table: "gratitude_wall" },
                (payload: any) => {
                    if (payload.eventType === "INSERT") {
                        setNotes(prev => {
                            if (prev.find(n => n.id === payload.new.id)) return prev;
                            return [payload.new, ...prev];
                        });
                    } else if (payload.eventType === "DELETE") {
                        setNotes(prev => prev.filter(n => n.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("gratitude_wall")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            if (data) setNotes(data);
        } catch (error) {
            console.error("Error fetching gratitude notes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSubmitting) return;

        setIsSubmitting(true);

        const optimistic: GratitudeNote = {
            id: `temp-${Date.now()}`,
            message: newMessage.trim(),
            author: authorName,
            created_at: new Date().toISOString(),
        };
        setNotes(prev => [optimistic, ...prev]);
        setNewMessage("");
        setIsAdding(false);

        try {
            const { data, error } = await supabase
                .from("gratitude_wall")
                .insert([{ message: optimistic.message, author: optimistic.author }])
                .select();

            if (error) throw error;

            if (data) {
                setNotes(prev => prev.map(n => n.id === optimistic.id ? data[0] : n));
                sendPushNotification({ author: authorName, title: "🌸 Catatan Syukur Baru!", body: `${authorName} berbagi sesuatu yang disyukuri`, url: "/secret-space", tag: "gratitude" });
            }
        } catch (err: unknown) {
            console.error("Error adding gratitude note:", err);
            setNotes(prev => prev.filter(n => n.id !== optimistic.id));
            const msg = err instanceof Error ? err.message : "Unknown error";
            if (msg.includes("relation") || msg.includes("does not exist")) {
                alert("Table gratitude_wall belum dibuat!\n\nJalankan SQL migration di Supabase SQL Editor.");
            } else {
                alert(`Gagal menambah catatan: ${msg}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Hapus catatan ini?")) return;

        const prev = notes;
        setNotes(n => n.filter(x => x.id !== id));

        try {
            const { error } = await supabase.from("gratitude_wall").delete().eq("id", id);
            if (error) throw error;
        } catch {
            setNotes(prev);
        }
    };

    return (
        <>
            <div className="glass rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 relative overflow-hidden">
                {/* Subtle cork board texture */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cork-wallet.png')" }} />
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, var(--accent-soft), transparent)" }} />

                {/* Header */}
                <div className="flex items-center justify-between mb-6 sm:mb-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Flower2 className="w-4 h-4" style={{ color: "var(--accent)" }} />
                            <h3 className="text-lg sm:text-xl font-light font-serif italic" style={{ color: "var(--text-secondary)" }}>
                                Gratitude Wall
                            </h3>
                        </div>
                        <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: "var(--text-muted)" }}>
                            Hal-hal yang kita syukuri
                        </p>
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass flex items-center gap-1.5 sm:gap-2 transition-all group/btn"
                    >
                        <Plus className="w-3 h-3 transition-colors" style={{ color: "var(--text-muted)" }} />
                        <span className="text-[9px] uppercase tracking-widest transition-colors" style={{ color: "var(--text-muted)" }}>
                            Tambah
                        </span>
                    </button>
                </div>

                {/* Notes Grid */}
                <div className="relative z-10">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div
                                    key={i}
                                    className="animate-pulse rounded-lg h-32 shadow-md"
                                    style={{ backgroundColor: STICKY_COLORS[i % STICKY_COLORS.length], opacity: 0.5 }}
                                />
                            ))}
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-16">
                            <Flower2 className="w-10 h-10 mx-auto mb-4 opacity-20" style={{ color: "var(--text-muted)" }} />
                            <p className="text-sm font-serif italic" style={{ color: "var(--text-muted)" }}>
                                Belum ada catatan. Jadi yang pertama berbagi rasa syukur! 🌸
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                            <AnimatePresence mode="popLayout">
                                {notes.map((note, idx) => {
                                    const style = getNoteStyle(idx);
                                    return (
                                        <motion.div
                                            key={note.id}
                                            initial={{ opacity: 0, scale: 0.8, rotate: style.rotation * 2 }}
                                            animate={{ opacity: 1, scale: 1, rotate: style.rotation }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            layout
                                            whileHover={{ scale: 1.05, rotate: 0, zIndex: 20, y: -5 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                            className="relative pt-5 pb-4 px-5 rounded-lg shadow-[2px_3px_12px_rgba(0,0,0,0.12)] group/note cursor-default"
                                            style={{ backgroundColor: style.color }}
                                        >
                                            {/* Flower decoration */}
                                            <span className="absolute bottom-2 right-3 text-base opacity-20 select-none pointer-events-none">
                                                {style.flower}
                                            </span>

                                            {/* Note content */}
                                            <p className="text-sm leading-relaxed text-black/70 mb-3 pr-4 font-light">
                                                &ldquo;{note.message}&rdquo;
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-serif italic text-black/40">
                                                        — {note.author}
                                                    </span>
                                                    <span className="text-[8px] uppercase tracking-wider text-black/25">
                                                        {new Date(note.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Paper fold at bottom-right */}
                                            <div
                                                className="absolute bottom-0 right-0 w-5 h-5 pointer-events-none"
                                                style={{ background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.04) 50%)" }}
                                            />

                                            {/* Delete button — admin only */}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDelete(note.id)}
                                                    className="absolute top-3 right-3 opacity-0 group-hover/note:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-500/20"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-black/30 hover:text-red-500 transition-colors" />
                                                </button>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Note Modal — Sticky Note Style */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsAdding(false)}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md"
                        style={{ backgroundColor: "var(--modal-overlay)" }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, rotate: -3 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.9, opacity: 0, rotate: 3 }}
                            className="p-6 sm:p-8 rounded-lg max-w-md w-full shadow-2xl relative"
                            style={{ backgroundColor: "#FEF9C3" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Pin on modal */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-300 to-red-500 shadow-md border border-white/30 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-white/50" />
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-5 mt-2">
                                <div>
                                    <h3 className="text-lg font-serif italic text-black/70">
                                        Aku Bersyukur Untuk...
                                    </h3>
                                    <p className="text-[9px] uppercase tracking-widest mt-1 text-black/30">
                                        sebagai {authorName}
                                    </p>
                                </div>
                                <button onClick={() => setIsAdding(false)}>
                                    <X className="w-5 h-5 text-black/30 hover:text-black/60 transition-colors" />
                                </button>
                            </div>

                            <form onSubmit={handleAdd}>
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Apa yang kamu syukuri hari ini?"
                                    className="w-full h-32 rounded-xl p-5 text-sm font-light outline-none resize-none leading-relaxed bg-white/50 border border-amber-200/50 text-black/70 placeholder:text-black/25"
                                    autoFocus
                                    maxLength={300}
                                />
                                <p className="text-right text-[9px] mt-1 pr-2 text-black/25">
                                    {newMessage.length}/300
                                </p>

                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSubmitting}
                                    className="w-full mt-3 p-4 rounded-xl text-sm font-medium flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                                    style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                                >
                                    <Send className="w-4 h-4" />
                                    Tempel di Dinding 📌
                                </button>
                            </form>

                            {/* Decorative flower */}
                            <span className="absolute bottom-3 right-4 text-xl opacity-15 pointer-events-none">🌸</span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
