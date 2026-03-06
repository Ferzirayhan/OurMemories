"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plus, Send, X, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/admin-context";

interface LoveReason {
    id: string;
    text: string;
    color?: string;
    author?: string;
    created_at: string;
}

const COLORS = [
    { name: "Rose", value: "#FDA4AF" },
    { name: "Cream", value: "#FEF9C3" },
    { name: "Sky", value: "#BAE6FD" },
    { name: "Lavender", value: "#E9D5FF" },
    { name: "Mint", value: "#BBF7D0" },
];

// Assign a consistent color to each reason based on its id (deterministic)
function getColorForReason(reason: LoveReason, index: number): string {
    if (reason.color) return reason.color;
    return COLORS[index % COLORS.length].value;
}

export function LoveJar() {
    const { isAdmin, authorName } = useAdmin();

    const [reasons, setReasons] = useState<LoveReason[]>([]);
    const [currentReason, setCurrentReason] = useState<LoveReason | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newReason, setNewReason] = useState("");
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value);

    // For "falling" animation
    const [fallingNote, setFallingNote] = useState<{ color: string } | null>(null);

    useEffect(() => {
        fetchReasons();
    }, []);

    const fetchReasons = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('love_reasons')
                .select('*')
                .order('created_at', { ascending: true });
            if (data) setReasons(data);
        } catch (error) {
            console.error("Error fetching reasons:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePaperClick = (reason: LoveReason, index: number) => {
        setCurrentReason({ ...reason, color: getColorForReason(reason, index) });
        setIsOpen(true);
    };

    const handleAddReason = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReason.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('love_reasons')
                .insert([{
                    text: newReason,
                    color: selectedColor,
                    author: authorName
                }])
                .select();

            if (error) throw error;

            if (data) {
                // Trigger falling animation
                setFallingNote({ color: selectedColor });

                // Add to list after a small delay to sync with animation
                setTimeout(() => {
                    setReasons(prev => [...prev, data[0]]);
                    setFallingNote(null);
                }, 1000);

                setNewReason("");
                setIsAdding(false);
            }
        } catch (err: unknown) {
            console.error("Error adding reason:", err);
            const msg = err instanceof Error ? err.message : 'Unknown error';
            if (msg.includes('policy') || msg.includes('permission') || msg.includes('RLS') || msg.includes('row-level security')) {
                alert('Gagal menambah pesan! INSERT policy belum ada di Supabase.\n\nJalankan SQL ini di Supabase SQL Editor:\n\nCREATE POLICY "Allow public insert" ON love_reasons FOR INSERT WITH CHECK (true);');
            } else if (msg.includes('relation') || msg.includes('does not exist')) {
                alert('Table love_reasons belum dibuat di Supabase!\n\nJalankan schema SQL di Supabase SQL Editor dulu.');
            } else {
                alert(`Gagal menambah pesan: ${msg}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReason = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Hapus pesan ini dari jar?")) return;

        try {
            const { data, error } = await supabase
                .from('love_reasons')
                .delete()
                .eq('id', id)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                throw new Error('RLS_BLOCKED');
            }

            setReasons(prev => prev.filter(r => r.id !== id));
            if (currentReason?.id === id) setIsOpen(false);
        } catch (error) {
            console.error("Error deleting reason:", error);
        }
    };

    return (
        <>
            <div className="flex flex-col items-center justify-center p-4 sm:p-8 glass rounded-[2rem] sm:rounded-[3rem] relative overflow-hidden group min-h-[400px] sm:min-h-[500px]">
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, var(--accent-soft), transparent)' }} />

                {/* Header */}
                <div className="absolute top-4 sm:top-8 left-4 sm:left-10 z-20">
                    <h3 className="text-lg sm:text-xl font-light font-serif italic" style={{ color: 'var(--text-secondary)' }}>The Love Jar</h3>
                    <p className="text-[9px] uppercase tracking-[0.3em] mt-1" style={{ color: 'var(--text-muted)' }}>
                        {reasons.length} Reasons Pinned
                    </p>
                </div>

                {/* Write Button */}
                <button
                    onClick={() => setIsAdding(true)}
                    className="absolute top-4 sm:top-8 right-4 sm:right-10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass flex items-center gap-1.5 sm:gap-2 transition-all z-20 group/btn"
                >
                    <Plus className="w-3 h-3 transition-colors" style={{ color: 'var(--text-muted)' }} />
                    <span className="text-[9px] uppercase tracking-widest transition-colors" style={{ color: 'var(--text-muted)' }}>Write Note</span>
                </button>

                {/* The Physical Jar Visualization */}
                <div className="relative mt-12 mb-8">
                    {/* Jar reflection & shine */}
                    <div className="absolute -inset-4 rounded-[4rem] blur-2xl pointer-events-none" style={{ backgroundColor: 'var(--jar-bg)' }} />

                    {/* Jar Body */}
                    <div className="w-36 h-52 sm:w-48 sm:h-64 border-2 rounded-t-[60px] rounded-b-[40px] relative backdrop-blur-[2px] shadow-2xl overflow-hidden transition-colors" style={{ borderColor: 'var(--jar-border)', backgroundColor: 'var(--jar-bg)' }}>
                        {/* Jar neck/lid neck */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-5 sm:h-6 border-x border-b rounded-b-2xl" style={{ borderColor: 'var(--jar-border)', backgroundColor: 'var(--jar-neck)' }} />

                        {/* Cork Lid */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-34 h-4 bg-[#8B4513]/40 border border-[#8B4513]/20 rounded-full blur-[0.5px]" />

                        {/* Papers inside the jar */}
                        <div className="absolute inset-0 pt-16 pb-6 px-4 flex flex-wrap-reverse content-start justify-center gap-1 overflow-y-auto custom-scrollbar no-scrollbar">
                            <AnimatePresence>
                                {reasons.map((reason, idx) => (
                                    <motion.div
                                        key={reason.id}
                                        initial={{ scale: 0, rotate: 0 }}
                                        animate={{
                                            scale: 1,
                                            rotate: (idx % 2 === 0 ? 15 : -15) + (Math.random() * 10 - 5),
                                            y: Math.random() * 5
                                        }}
                                        whileHover={{ scale: 1.2, rotate: 0, zIndex: 30 }}
                                        onClick={() => handlePaperClick(reason, idx)}
                                        className="w-8 h-10 rounded-sm shadow-lg cursor-pointer flex items-center justify-center relative group/paper shrink-0"
                                        style={{ backgroundColor: getColorForReason(reason, idx) }}
                                    >
                                        <Heart className="w-3 h-3 text-black/20" />

                                        {/* Restricted Delete Button */}
                                        {isAdmin && (
                                            <button
                                                onClick={(e) => handleDeleteReason(reason.id, e)}
                                                className="absolute -top-1 -right-1 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/paper:opacity-100 transition-opacity hover:bg-red-500"
                                            >
                                                <X className="w-2 h-2 text-white" />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Falling animation simulation */}
                        <AnimatePresence>
                            {fallingNote && (
                                <motion.div
                                    initial={{ y: -100, x: 0, rotate: 0, opacity: 1 }}
                                    animate={{
                                        y: 200,
                                        x: [0, 20, -20, 10, -10, 0],
                                        rotate: 720,
                                        opacity: [1, 1, 0.8]
                                    }}
                                    transition={{ duration: 1, ease: "easeIn" }}
                                    className="absolute left-1/2 -translate-x-1/2 w-8 h-10 rounded-sm shadow-xl z-50"
                                    style={{ backgroundColor: fallingNote.color }}
                                >
                                    <Heart className="w-3 h-3 text-black/20 m-auto mt-3" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Reflections */}
                        <div className="absolute top-10 left-6 w-1.5 h-40 rounded-full blur-[2px]" style={{ backgroundColor: 'var(--jar-reflection)' }} />
                        <div className="absolute top-20 right-8 w-1 h-20 rounded-full blur-[1px]" style={{ backgroundColor: 'var(--jar-reflection)' }} />
                    </div>

                    {/* Jar Label */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 pointer-events-none opacity-40">
                        <Heart className="w-full h-full" style={{ color: 'var(--jar-border)', opacity: 0.4 }} fill="currentColor" />
                    </div>
                </div>

                <div className="text-center relative z-10 max-w-xs">
                    <p className="text-[10px] uppercase tracking-[0.4em]" style={{ color: 'var(--text-muted)' }}>
                        {loading ? "Counting my love..." : "Every paper is a reason why I love you."}
                    </p>
                </div>
            </div>

            {/* Read Reason Modal */}
            <AnimatePresence>
                {isOpen && currentReason && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl"
                        style={{ backgroundColor: 'var(--modal-overlay)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 20, rotate: -2 }}
                            animate={{ scale: 1, y: 0, rotate: 0 }}
                            exit={{ scale: 0.8, y: 20, opacity: 0 }}
                            className="p-8 sm:p-12 md:p-16 rounded-[2rem] sm:rounded-[3rem] max-w-lg w-full relative overflow-hidden text-center shadow-2xl"
                            style={{ backgroundColor: currentReason.color || COLORS[0].value }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Paper Texture Overlay */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />

                            <div className="relative z-10">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-0 right-0 w-4 h-4 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors"
                                >
                                    <X className="w-2.5 h-2.5 text-black/50" />
                                </button>

                                <Heart className="w-12 h-12 text-black/20 mx-auto mb-10" fill="currentColor" />

                                <p className="text-2xl md:text-3xl font-serif italic text-black/80 leading-relaxed">
                                    &ldquo;{currentReason.text}&rdquo;
                                </p>

                                <div className="mt-12 flex items-center justify-center gap-2">
                                    <div className="w-12 h-[1px] bg-black/10" />
                                    <p className="text-[10px] uppercase tracking-widest text-black/40 font-medium">
                                        — {currentReason.author || "Love Note"} —
                                    </p>
                                    <div className="w-12 h-[1px] bg-black/10" />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Reason Modal */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md"
                        style={{ backgroundColor: 'var(--modal-overlay)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] max-w-md w-full border"
                            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-serif italic font-light" style={{ color: 'var(--text-primary)' }}>New Love Note</h3>
                                <button onClick={() => setIsAdding(false)}><X className="w-6 h-6 transition-colors" style={{ color: 'var(--text-muted)' }} /></button>
                            </div>

                            <form onSubmit={handleAddReason}>
                                <div className="space-y-6">
                                    {/* Color Picker */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] uppercase tracking-widest pl-1" style={{ color: 'var(--text-muted)' }}>Pick a color</p>
                                        <div className="flex gap-3">
                                            {COLORS.map(color => (
                                                <button
                                                    key={color.value}
                                                    type="button"
                                                    onClick={() => setSelectedColor(color.value)}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color.value ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
                                                    style={{ backgroundColor: color.value }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] uppercase tracking-widest pl-1" style={{ color: 'var(--text-muted)' }}>Your Reason</p>
                                        <textarea
                                            value={newReason}
                                            onChange={(e) => setNewReason(e.target.value)}
                                            placeholder="Why do you love her today?"
                                            className="w-full h-32 rounded-2xl p-6 text-lg font-serif italic outline-none resize-none leading-relaxed"
                                            style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                            autoFocus
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!newReason.trim() || isSubmitting}
                                        className="w-full p-5 rounded-2xl text-sm font-medium flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                                        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                                    >
                                        {isSubmitting ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Drop in Jar
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </>
    );
}
