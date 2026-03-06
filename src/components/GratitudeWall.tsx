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

const PASTEL_ACCENTS = [
    "from-rose-200/20 to-rose-300/10",
    "from-amber-200/20 to-amber-300/10",
    "from-sky-200/20 to-sky-300/10",
    "from-violet-200/20 to-violet-300/10",
    "from-emerald-200/20 to-emerald-300/10",
    "from-pink-200/20 to-pink-300/10",
];

function getAccent(index: number) {
    return PASTEL_ACCENTS[index % PASTEL_ACCENTS.length];
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
            .channel('gratitude-changes')
            .on(
                'postgres_changes' as any,
                { event: '*', table: 'gratitude_wall' },
                (payload: any) => {
                    if (payload.eventType === 'INSERT') {
                        setNotes(prev => {
                            if (prev.find(n => n.id === payload.new.id)) return prev;
                            return [payload.new, ...prev];
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setNotes(prev => prev.filter(n => n.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('gratitude_wall')
                .select('*')
                .order('created_at', { ascending: false });

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

        // Optimistic
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
                .from('gratitude_wall')
                .insert([{ message: optimistic.message, author: optimistic.author }])
                .select();

            if (error) throw error;

            if (data) {
                setNotes(prev => prev.map(n => n.id === optimistic.id ? data[0] : n));
                sendPushNotification({ author: authorName, title: "🌸 New Gratitude Note!", body: `${authorName} shared something they're grateful for`, url: "/secret-space", tag: "gratitude" });
            }
        } catch (err: unknown) {
            console.error("Error adding gratitude note:", err);
            setNotes(prev => prev.filter(n => n.id !== optimistic.id));
            const msg = err instanceof Error ? err.message : 'Unknown error';
            if (msg.includes('relation') || msg.includes('does not exist')) {
                alert('Table gratitude_wall belum dibuat!\n\nJalankan SQL migration di Supabase SQL Editor.');
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
            const { error } = await supabase
                .from('gratitude_wall')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch {
            setNotes(prev);
        }
    };

    return (
        <>
            <div className="glass rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, var(--accent-soft), transparent)' }} />

                {/* Header */}
                <div className="flex items-center justify-between mb-6 sm:mb-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Flower2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                            <h3 className="text-lg sm:text-xl font-light font-serif italic" style={{ color: 'var(--text-secondary)' }}>
                                Gratitude Wall
                            </h3>
                        </div>
                        <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
                            Things we&apos;re grateful for
                        </p>
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass flex items-center gap-1.5 sm:gap-2 transition-all group/btn"
                    >
                        <Plus className="w-3 h-3 transition-colors" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-[9px] uppercase tracking-widest transition-colors" style={{ color: 'var(--text-muted)' }}>
                            Add
                        </span>
                    </button>
                </div>

                {/* Notes Grid */}
                <div className="relative z-10">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="animate-pulse rounded-2xl h-28" style={{ backgroundColor: 'var(--glass-bg)' }} />
                            ))}
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-12">
                            <Flower2 className="w-10 h-10 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-muted)' }} />
                            <p className="text-sm font-serif italic" style={{ color: 'var(--text-muted)' }}>
                                No gratitude notes yet. Be the first to share what you&apos;re thankful for!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <AnimatePresence mode="popLayout">
                                {notes.map((note, idx) => (
                                    <motion.div
                                        key={note.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        layout
                                        className={`relative p-4 sm:p-5 rounded-2xl border group/note bg-gradient-to-br ${getAccent(idx)}`}
                                        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--glass-bg)' }}
                                    >
                                        <p className="text-sm font-light leading-relaxed mb-3 pr-6" style={{ color: 'var(--text-primary)' }}>
                                            &ldquo;{note.message}&rdquo;
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-serif italic" style={{ color: 'var(--text-muted)' }}>
                                                    — {note.author}
                                                </span>
                                                <span className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                                    {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Delete button — admin only */}
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDelete(note.id)}
                                                className="absolute top-3 right-3 opacity-0 group-hover/note:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-500/20"
                                                style={{ color: 'var(--text-faint)' }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5 hover:text-red-400 transition-colors" />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Note Modal */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsAdding(false)}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md"
                        style={{ backgroundColor: 'var(--modal-overlay)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] max-w-md w-full border"
                            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-serif italic font-light" style={{ color: 'var(--text-primary)' }}>
                                        I&apos;m Grateful For...
                                    </h3>
                                    <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: 'var(--text-faint)' }}>
                                        as {authorName}
                                    </p>
                                </div>
                                <button onClick={() => setIsAdding(false)}>
                                    <X className="w-5 h-5 transition-colors" style={{ color: 'var(--text-muted)' }} />
                                </button>
                            </div>

                            <form onSubmit={handleAdd}>
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="What are you grateful for today?"
                                    className="w-full h-32 rounded-2xl p-5 text-sm font-light outline-none resize-none leading-relaxed"
                                    style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    autoFocus
                                    maxLength={300}
                                />
                                <p className="text-right text-[9px] mt-1 pr-2" style={{ color: 'var(--text-faint)' }}>
                                    {newMessage.length}/300
                                </p>

                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSubmitting}
                                    className="w-full mt-4 p-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                                    style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                                >
                                    <Send className="w-4 h-4" />
                                    Post Gratitude
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
