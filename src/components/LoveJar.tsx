"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plus, Send, X, Sparkles, Flame } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/admin-context";
import { sendPushNotification } from "@/lib/push-notifications";

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

const MAX_DAILY_DRAWS = 2;

function getColorForReason(reason: LoveReason, index: number): string {
    if (reason.color) return reason.color;
    return COLORS[index % COLORS.length].value;
}

// === Daily Draw State (localStorage) ===
interface DailyState {
    date: string;
    draws: number;
    drawnIds: string[];
    streak: number;
    lastDate: string;
}

function getTodayStr(): string {
    return new Date().toISOString().slice(0, 10);
}

function loadDailyState(): DailyState {
    if (typeof window === "undefined") return { date: "", draws: 0, drawnIds: [], streak: 0, lastDate: "" };
    try {
        const raw = localStorage.getItem("lovejar_daily");
        if (raw) {
            const parsed = JSON.parse(raw);
            const today = getTodayStr();
            if (parsed.date === today) return parsed;

            // New day — calculate streak
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().slice(0, 10);
            const newStreak = parsed.date === yesterdayStr ? (parsed.streak || 0) + 1 : parsed.draws > 0 ? 1 : 0;

            return { date: today, draws: 0, drawnIds: [], streak: newStreak, lastDate: parsed.date };
        }
    } catch { /* ignore */ }
    return { date: getTodayStr(), draws: 0, drawnIds: [], streak: 0, lastDate: "" };
}

function saveDailyState(state: DailyState) {
    if (typeof window === "undefined") return;
    localStorage.setItem("lovejar_daily", JSON.stringify(state));
}

// === Confetti Hearts ===
function HeartConfetti() {
    const hearts = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        size: 10 + Math.random() * 14,
        duration: 1.5 + Math.random() * 1,
    }));

    return (
        <div className="fixed inset-0 pointer-events-none z-[200]">
            {hearts.map((h) => (
                <motion.div
                    key={h.id}
                    initial={{ y: -20, x: `${h.x}vw`, opacity: 1, scale: 0, rotate: 0 }}
                    animate={{ y: "110vh", opacity: [1, 1, 0], scale: 1, rotate: 360 + Math.random() * 360 }}
                    transition={{ duration: h.duration, delay: h.delay, ease: "easeIn" }}
                    className="absolute"
                    style={{ fontSize: h.size }}
                >
                    💕
                </motion.div>
            ))}
        </div>
    );
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

    // Daily draw state
    const [dailyState, setDailyState] = useState<DailyState>({ date: "", draws: 0, drawnIds: [], streak: 0, lastDate: "" });
    const [isShaking, setIsShaking] = useState(false);
    const [flyingNote, setFlyingNote] = useState<{ color: string; text: string } | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [fallingNote, setFallingNote] = useState<{ color: string } | null>(null);
    const [countdown, setCountdown] = useState("");

    // Load daily state on mount
    useEffect(() => {
        setDailyState(loadDailyState());
    }, []);

    // Countdown to midnight
    useEffect(() => {
        if (isAdmin) return;
        if (dailyState.draws < MAX_DAILY_DRAWS) return;

        const updateCountdown = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const diff = tomorrow.getTime() - now.getTime();
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            setCountdown(`${h}j ${m}m`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000);
        return () => clearInterval(interval);
    }, [isAdmin, dailyState.draws]);

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

    const canDraw = !isAdmin && dailyState.draws < MAX_DAILY_DRAWS && reasons.length > 0;
    const drawsLeft = MAX_DAILY_DRAWS - dailyState.draws;

    // Admin can click papers directly
    const handlePaperClick = (reason: LoveReason, index: number) => {
        if (!isAdmin) return;
        setCurrentReason({ ...reason, color: getColorForReason(reason, index) });
        setIsOpen(true);
    };

    // === DRAW MECHANIC ===
    const handleDraw = useCallback(() => {
        if (!canDraw || isShaking) return;

        // Pick random (avoid recently drawn)
        const available = reasons.filter((r) => !dailyState.drawnIds.includes(r.id));
        const pool = available.length > 0 ? available : reasons;
        const randomIndex = Math.floor(Math.random() * pool.length);
        const picked = pool[randomIndex];
        const globalIndex = reasons.findIndex((r) => r.id === picked.id);
        const color = getColorForReason(picked, globalIndex);

        // 1. Shake jar
        setIsShaking(true);

        // 2. Fly note out
        setTimeout(() => {
            setFlyingNote({ color, text: picked.text });
            setIsShaking(false);
        }, 800);

        // 3. Show modal + confetti
        setTimeout(() => {
            setFlyingNote(null);
            setCurrentReason({ ...picked, color });
            setIsOpen(true);
            setShowConfetti(true);

            const newState: DailyState = {
                ...dailyState,
                draws: dailyState.draws + 1,
                drawnIds: [...dailyState.drawnIds, picked.id],
                date: getTodayStr(),
            };
            if (dailyState.draws === 0 && dailyState.streak === 0) {
                newState.streak = 1;
            }
            setDailyState(newState);
            saveDailyState(newState);
        }, 1800);

        // 4. Clear confetti
        setTimeout(() => setShowConfetti(false), 4000);
    }, [canDraw, isShaking, reasons, dailyState]);

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
                setFallingNote({ color: selectedColor });
                setTimeout(() => {
                    setReasons(prev => [...prev, data[0]]);
                    setFallingNote(null);
                }, 1000);

                setNewReason("");
                setIsAdding(false);
                sendPushNotification({ author: authorName, title: "💌 New Love Note!", body: `${authorName} dropped a new note in the Love Jar`, url: "/secret-space", tag: "love-jar" });
            }
        } catch (err: unknown) {
            console.error("Error adding reason:", err);
            const msg = err instanceof Error ? err.message : 'Unknown error';
            if (msg.includes('policy') || msg.includes('permission') || msg.includes('RLS') || msg.includes('row-level security')) {
                alert('Gagal menambah pesan! INSERT policy belum ada di Supabase.');
            } else if (msg.includes('relation') || msg.includes('does not exist')) {
                alert('Table love_reasons belum dibuat di Supabase!');
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
            if (!data || data.length === 0) throw new Error('RLS_BLOCKED');

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
                        {reasons.length} kertas cinta
                    </p>
                </div>

                {/* Streak Badge — Ratih only */}
                {!isAdmin && dailyState.streak > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-4 sm:top-8 right-4 sm:right-10 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full glass"
                    >
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {dailyState.streak} hari
                        </span>
                    </motion.div>
                )}

                {/* Write Button — Admin only */}
                {isAdmin && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="absolute top-4 sm:top-8 right-4 sm:right-10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass flex items-center gap-1.5 sm:gap-2 transition-all z-20 group/btn"
                    >
                        <Plus className="w-3 h-3 transition-colors" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-[9px] uppercase tracking-widest transition-colors" style={{ color: 'var(--text-muted)' }}>Write Note</span>
                    </button>
                )}

                {/* The Physical Jar */}
                <motion.div
                    className="relative mt-12 mb-4"
                    animate={isShaking ? {
                        rotate: [0, -5, 5, -5, 5, -3, 3, -2, 2, 0],
                        y: [0, -3, 0, -3, 0, -2, 0, -1, 0, 0],
                    } : {}}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                    <div className="absolute -inset-4 rounded-[4rem] blur-2xl pointer-events-none" style={{ backgroundColor: 'var(--jar-bg)' }} />

                    <div className="w-36 h-52 sm:w-48 sm:h-64 border-2 rounded-t-[60px] rounded-b-[40px] relative backdrop-blur-[2px] shadow-2xl overflow-hidden transition-colors" style={{ borderColor: 'var(--jar-border)', backgroundColor: 'var(--jar-bg)' }}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-5 sm:h-6 border-x border-b rounded-b-2xl" style={{ borderColor: 'var(--jar-border)', backgroundColor: 'var(--jar-neck)' }} />
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-34 h-4 bg-[#8B4513]/40 border border-[#8B4513]/20 rounded-full blur-[0.5px]" />

                        {/* Papers inside jar */}
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
                                        whileHover={isAdmin ? { scale: 1.2, rotate: 0, zIndex: 30 } : {}}
                                        onClick={() => handlePaperClick(reason, idx)}
                                        className={`w-8 h-10 rounded-sm shadow-lg flex items-center justify-center relative group/paper shrink-0 ${isAdmin ? 'cursor-pointer' : ''}`}
                                        style={{ backgroundColor: getColorForReason(reason, idx) }}
                                    >
                                        <Heart className="w-3 h-3 text-black/20" />

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

                        {/* Falling animation (admin add) */}
                        <AnimatePresence>
                            {fallingNote && (
                                <motion.div
                                    initial={{ y: -100, x: 0, rotate: 0, opacity: 1 }}
                                    animate={{ y: 200, x: [0, 20, -20, 10, -10, 0], rotate: 720, opacity: [1, 1, 0.8] }}
                                    transition={{ duration: 1, ease: "easeIn" }}
                                    className="absolute left-1/2 -translate-x-1/2 w-8 h-10 rounded-sm shadow-xl z-50"
                                    style={{ backgroundColor: fallingNote.color }}
                                >
                                    <Heart className="w-3 h-3 text-black/20 m-auto mt-3" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Flying note out (draw animation) */}
                        <AnimatePresence>
                            {flyingNote && (
                                <motion.div
                                    initial={{ y: 100, x: 0, rotate: 0, scale: 0.5, opacity: 0 }}
                                    animate={{
                                        y: -150,
                                        x: [0, -10, 15, -5, 0],
                                        rotate: [-10, 15, -5, 10, 0],
                                        scale: [0.5, 0.8, 1.2, 1],
                                        opacity: [0, 1, 1, 0],
                                    }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="absolute left-1/2 -translate-x-1/2 w-12 h-14 rounded-sm shadow-2xl z-50 flex items-center justify-center"
                                    style={{ backgroundColor: flyingNote.color }}
                                >
                                    <Heart className="w-4 h-4 text-black/20" fill="currentColor" />
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
                </motion.div>

                {/* DRAW BUTTON — Ratih only */}
                {!isAdmin && (
                    <div className="relative z-10 text-center mt-2 space-y-3">
                        {canDraw ? (
                            <>
                                <motion.button
                                    onClick={handleDraw}
                                    disabled={isShaking}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-6 py-3 rounded-2xl text-sm font-medium flex items-center gap-2 mx-auto transition-all disabled:opacity-50 shadow-lg"
                                    style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                                >
                                    <Sparkles className={`w-4 h-4 ${isShaking ? 'animate-spin' : ''}`} />
                                    {isShaking ? "Ngambil..." : "Ambil Kertas 💌"}
                                </motion.button>
                                <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
                                    {drawsLeft} kesempatan lagi hari ini
                                </p>
                            </>
                        ) : reasons.length === 0 ? (
                            <p className="text-[10px] uppercase tracking-[0.4em]" style={{ color: 'var(--text-muted)' }}>
                                Jar-nya masih kosong...
                            </p>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl glass">
                                    <Heart className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} fill="currentColor" />
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        Kamu udah buka 2 kertas hari ini
                                    </p>
                                </div>
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                    Balik lagi besok ya — <span style={{ color: 'var(--accent)' }}>{countdown}</span>
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Admin — bottom text */}
                {isAdmin && (
                    <div className="text-center relative z-10 max-w-xs">
                        <p className="text-[10px] uppercase tracking-[0.4em]" style={{ color: 'var(--text-muted)' }}>
                            {loading ? "Loading..." : `${reasons.length} notes inside`}
                        </p>
                    </div>
                )}
            </div>

            {/* Confetti */}
            <AnimatePresence>
                {showConfetti && <HeartConfetti />}
            </AnimatePresence>

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
                            initial={{ scale: 0.3, y: 100, rotate: -15 }}
                            animate={{ scale: 1, y: 0, rotate: 0 }}
                            exit={{ scale: 0.8, y: 20, opacity: 0 }}
                            transition={{ type: "spring", damping: 15, stiffness: 200 }}
                            className="p-8 sm:p-12 md:p-16 rounded-[2rem] sm:rounded-[3rem] max-w-lg w-full relative overflow-hidden text-center shadow-2xl"
                            style={{ backgroundColor: currentReason.color || COLORS[0].value }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />

                            <div className="relative z-10">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-0 right-0 w-6 h-6 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors"
                                >
                                    <X className="w-3 h-3 text-black/50" />
                                </button>

                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                >
                                    <Heart className="w-12 h-12 text-black/20 mx-auto mb-8" fill="currentColor" />
                                </motion.div>

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-2xl md:text-3xl font-serif italic text-black/80 leading-relaxed"
                                >
                                    &ldquo;{currentReason.text}&rdquo;
                                </motion.p>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-12 flex items-center justify-center gap-2"
                                >
                                    <div className="w-12 h-[1px] bg-black/10" />
                                    <p className="text-[10px] uppercase tracking-widest text-black/40 font-medium">
                                        — {currentReason.author || "Love Note"} —
                                    </p>
                                    <div className="w-12 h-[1px] bg-black/10" />
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Reason Modal — Admin only */}
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
