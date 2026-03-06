"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plus, Send, X, Sparkles, Flame, BookOpen, Gift, RotateCcw, MessageCircle } from "lucide-react";
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
const CLEAN_TAPS_NEEDED = 5;

const GUILT_MESSAGES = [
    { emoji: "😢", text: "Kamu kemarin nggak dateng... Ezi nunguin loh" },
    { emoji: "🥺", text: "Kertas-kertasnya nanyain kamu kemarin..." },
    { emoji: "💔", text: "Jar-nya sedih kamu nggak mampir..." },
    { emoji: "😿", text: "Ezi naro kertas baru tapi kamu nggak dateng..." },
];

function getColorForReason(reason: LoveReason, index: number): string {
    if (reason.color) return reason.color;
    return COLORS[index % COLORS.length].value;
}

// Deterministic "random" rotation per paper so it doesn't jitter on re-render
function getPaperTransform(idx: number) {
    const seed = ((idx * 7919 + 104729) % 100) / 100; // pseudo-random 0-1
    const seed2 = ((idx * 6271 + 81239) % 100) / 100;
    const rotate = (seed * 40 - 20); // -20 to +20
    const y = seed2 * 4; // 0-4px
    return { rotate, y };
}

// === Daily Draw State (localStorage) ===
interface DailyState {
    date: string;
    draws: number;
    drawnIds: string[];
    streak: number;
    lastDate: string;
    brokeStreak: boolean;
    inPenalty: boolean;
    jarCleaned: boolean;
}

function getTodayStr(): string {
    return new Date().toISOString().slice(0, 10);
}

function loadDailyState(): DailyState {
    const empty: DailyState = { date: getTodayStr(), draws: 0, drawnIds: [], streak: 0, lastDate: "", brokeStreak: false, inPenalty: false, jarCleaned: false };
    if (typeof window === "undefined") return { ...empty, date: "" };
    try {
        const raw = localStorage.getItem("lovejar_daily");
        if (raw) {
            const parsed = JSON.parse(raw);
            const today = getTodayStr();
            if (parsed.date === today) return { ...empty, ...parsed };

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().slice(0, 10);

            if (parsed.date === yesterdayStr) {
                // Came yesterday — streak continues
                const newStreak = (parsed.streak || 0) + 1;
                return {
                    ...empty, date: today, streak: newStreak, lastDate: parsed.date,
                    inPenalty: parsed.inPenalty ? newStreak < 3 : false,
                };
            } else {
                // Missed day(s) — streak broken!
                const hadStreak = (parsed.streak || 0) >= 2;
                return {
                    ...empty, date: today, lastDate: parsed.date,
                    brokeStreak: hadStreak,
                    inPenalty: hadStreak,
                };
            }
        }
    } catch { /* ignore */ }
    return empty;
}

function saveDailyState(state: DailyState) {
    if (typeof window === "undefined") return;
    localStorage.setItem("lovejar_daily", JSON.stringify(state));
}

// === Collection (saved opened notes) ===
interface CollectionItem {
    id: string;
    text: string;
    color: string;
    author?: string;
    openedAt: string;
}

function loadCollection(): CollectionItem[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem("lovejar_collection");
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [];
}

function saveCollection(items: CollectionItem[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem("lovejar_collection", JSON.stringify(items));
}

function isReward14Claimed(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("lovejar_reward14") === "true";
}

function claimReward14() {
    if (typeof window === "undefined") return;
    localStorage.setItem("lovejar_reward14", "true");
}

function isReward30Claimed(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("lovejar_reward30") === "true";
}

function claimReward30() {
    if (typeof window === "undefined") return;
    localStorage.setItem("lovejar_reward30", "true");
}

// === Confetti Hearts ===
function HeartConfetti() {
    const [hearts] = useState(() =>
        Array.from({ length: 14 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 0.4,
            size: 10 + Math.random() * 16,
            duration: 1.5 + Math.random() * 1,
            emoji: ["💕", "💗", "✨", "💌", "🩷"][i % 5],
        }))
    );

    return (
        <div className="fixed inset-0 pointer-events-none z-[200]">
            {hearts.map((h) => (
                <motion.div
                    key={h.id}
                    initial={{ y: -20, x: `${h.x}vw`, opacity: 1, scale: 0 }}
                    animate={{ y: "110vh", opacity: [1, 1, 0], scale: 1, rotate: 360 }}
                    transition={{ duration: h.duration, delay: h.delay, ease: "easeIn" }}
                    className="absolute"
                    style={{ fontSize: h.size }}
                >
                    {h.emoji}
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
    const [dailyState, setDailyState] = useState<DailyState>({ date: "", draws: 0, drawnIds: [], streak: 0, lastDate: "", brokeStreak: false, inPenalty: false, jarCleaned: false });
    const [pickingId, setPickingId] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [fallingNote, setFallingNote] = useState<{ color: string } | null>(null);
    const [countdown, setCountdown] = useState("");
    const animatingRef = useRef(false);

    // Collection + Reward state
    const [collection, setCollection] = useState<CollectionItem[]>([]);
    const [showCollection, setShowCollection] = useState(false);
    const [showReward, setShowReward] = useState(false);
    const [rewardClaimed, setRewardClaimed] = useState(false);
    const [reward14Claimed, setReward14Claimed] = useState(false);
    const [showStreakTracker, setShowStreakTracker] = useState(false);
    const [streakRewardDay, setStreakRewardDay] = useState<number | null>(null);

    // Penalty state (streak broken)
    const [showSadMessage, setShowSadMessage] = useState(false);
    const [guiltMessage, setGuiltMessage] = useState<{ emoji: string; text: string } | null>(null);
    const [cleanTaps, setCleanTaps] = useState(0);

    useEffect(() => {
        setDailyState(loadDailyState());
        setCollection(loadCollection());
        setRewardClaimed(isReward30Claimed());
        setReward14Claimed(isReward14Claimed());
    }, []);

    // Check for 30-day streak reward on page load
    useEffect(() => {
        if (!isAdmin && dailyState.streak >= 30 && !isReward30Claimed()) {
            const timer = setTimeout(() => setShowReward(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [isAdmin, dailyState.streak]);

    // Show guilt-trip message when returning after streak break
    useEffect(() => {
        if (!isAdmin && dailyState.brokeStreak && !dailyState.jarCleaned) {
            const msg = GUILT_MESSAGES[Math.floor(Math.random() * GUILT_MESSAGES.length)];
            setGuiltMessage(msg);
            const timer = setTimeout(() => setShowSadMessage(true), 500);
            return () => clearTimeout(timer);
        }
    }, [isAdmin, dailyState.brokeStreak, dailyState.jarCleaned]);

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

    const jarDirty = !isAdmin && dailyState.brokeStreak && !dailyState.jarCleaned;
    const maxDraws = (!isAdmin && dailyState.inPenalty) ? 1 : MAX_DAILY_DRAWS;
    const canDraw = !isAdmin && dailyState.draws < maxDraws && reasons.length > 0 && !jarDirty;
    const drawsLeft = maxDraws - dailyState.draws;

    // Record a draw and show note
    const finishDraw = useCallback((picked: LoveReason, color: string) => {
        setCurrentReason({ ...picked, color });
        setIsOpen(true);
        setShowConfetti(true);
        setPickingId(null);

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

        // Save to collection
        setCollection(prev => {
            if (prev.some(item => item.id === picked.id)) return prev;
            const newItem: CollectionItem = {
                id: picked.id,
                text: picked.text,
                color,
                author: picked.author,
                openedAt: new Date().toISOString(),
            };
            const updated = [...prev, newItem];
            saveCollection(updated);
            return updated;
        });

        setTimeout(() => setShowConfetti(false), 4000);
        animatingRef.current = false;
    }, [dailyState]);

    // === CLEAN THE JAR (after streak break) ===
    const handleCleanJar = () => {
        if (!jarDirty) return;
        const next = cleanTaps + 1;
        setCleanTaps(next);
        if (next >= CLEAN_TAPS_NEEDED) {
            const newState = { ...dailyState, jarCleaned: true };
            setDailyState(newState);
            saveDailyState(newState);
        }
    };

    // === PICK A SPECIFIC PAPER (Ratih taps a paper) ===
    const handlePaperPick = useCallback((reason: LoveReason, index: number) => {
        if (isAdmin) {
            // Admin: view directly, no limit
            setCurrentReason({ ...reason, color: getColorForReason(reason, index) });
            setIsOpen(true);
            return;
        }

        if (!canDraw || animatingRef.current) return;
        animatingRef.current = true;

        const color = getColorForReason(reason, index);

        // 1. Mark paper as "picking" — triggers fly-out animation
        setPickingId(reason.id);

        // 2. After fly animation, show modal
        setTimeout(() => {
            finishDraw(reason, color);
        }, 900);
    }, [isAdmin, canDraw, finishDraw]);

    const handleAddReason = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReason.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('love_reasons')
                .insert([{ text: newReason, color: selectedColor, author: authorName }])
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
            alert(`Gagal menambah pesan: ${msg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReason = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Hapus pesan ini dari jar?")) return;

        try {
            const { data, error } = await supabase.from('love_reasons').delete().eq('id', id).select();
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
            <div className="flex flex-col items-center justify-center p-4 sm:p-8 glass rounded-[2rem] sm:rounded-[3rem] relative overflow-hidden group min-h-[500px] sm:min-h-[600px]">
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, var(--accent-soft), transparent)' }} />

                {/* Header */}
                <div className="absolute top-4 sm:top-8 left-4 sm:left-10 z-20">
                    <h3 className="text-lg sm:text-xl font-light font-serif italic" style={{ color: 'var(--text-secondary)' }}>The Love Jar</h3>
                    <p className="text-[9px] uppercase tracking-[0.3em] mt-1" style={{ color: 'var(--text-muted)' }}>
                        {reasons.length} kertas cinta
                    </p>
                </div>

                {/* Streak Badge — Ratih only (clickable) */}
                {!isAdmin && dailyState.streak > 0 && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowStreakTracker(true)}
                        className="absolute top-4 sm:top-8 right-4 sm:right-10 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full glass cursor-pointer"
                    >
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {dailyState.streak} hari {rewardClaimed && '🏆'}
                        </span>
                    </motion.button>
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

                {/* Instruction for Ratih */}
                {!isAdmin && (canDraw || jarDirty) && (
                    <p className="absolute top-14 sm:top-[4.5rem] left-4 sm:left-10 text-[9px] italic z-20" style={{ color: 'var(--text-faint)' }}>
                        {jarDirty ? 'Bersihin jar-nya dulu ya...' : 'Pilih kertas yang kamu mau~'}
                    </p>
                )}

                {/* The Physical Jar — BIGGER */}
                <div className="relative mt-14 mb-2">
                    <div className="absolute -inset-6 rounded-[5rem] blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--jar-bg)' }} />

                    {/* Jar Body — Large */}
                    <div
                        className={`w-48 h-64 sm:w-60 sm:h-80 md:w-72 md:h-[22rem] border-2 rounded-t-[70px] rounded-b-[50px] relative backdrop-blur-[2px] shadow-2xl overflow-hidden transition-all duration-700 ${jarDirty ? 'grayscale-[50%] brightness-[0.7]' : ''}`}
                        style={{ borderColor: 'var(--jar-border)', backgroundColor: 'var(--jar-bg)' }}
                    >
                        {/* Dust overlay when streak broken */}
                        <AnimatePresence>
                            {jarDirty && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 - (cleanTaps / CLEAN_TAPS_NEEDED) * 0.8 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    transition={{ duration: 0.3 }}
                                    onClick={handleCleanJar}
                                    className="absolute inset-0 z-30 flex flex-col items-center justify-center cursor-pointer"
                                    style={{ backgroundColor: 'rgba(120, 80, 40, 0.35)', backdropFilter: 'blur(1px)' }}
                                >
                                    <motion.p
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="text-3xl mb-2"
                                    >
                                        🥺
                                    </motion.p>
                                    <p className="text-[11px] text-white/90 font-medium text-center px-6">
                                        Jar-nya kangen kamu...
                                    </p>
                                    <p className="text-[9px] text-white/60 mt-1.5">
                                        Tap {CLEAN_TAPS_NEEDED - cleanTaps}x untuk bersihin 🧹
                                    </p>
                                    {/* Dust particles */}
                                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                        {[...Array(8)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/30"
                                                style={{ left: `${10 + i * 11}%`, top: `${15 + (i * 19) % 65}%` }}
                                                animate={{ y: [0, -10, 0], x: [0, 3, -3, 0], opacity: [0.2, 0.5, 0.2] }}
                                                transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.15 }}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Jar neck */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 sm:w-36 md:w-40 h-5 sm:h-6 border-x border-b rounded-b-2xl z-10" style={{ borderColor: 'var(--jar-border)', backgroundColor: 'var(--jar-neck)' }} />

                        {/* Cork */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-36 sm:w-44 h-4 bg-[#8B4513]/40 border border-[#8B4513]/20 rounded-full blur-[0.5px] z-10" />

                        {/* Papers Grid — small papers */}
                        <div className="absolute inset-0 pt-14 pb-4 px-2 sm:px-3 flex flex-wrap content-end justify-center gap-[2px] sm:gap-[3px] overflow-hidden">
                            <AnimatePresence>
                                {reasons.map((reason, idx) => {
                                    const transform = getPaperTransform(idx);
                                    const isPicking = pickingId === reason.id;
                                    const wasDrawnToday = dailyState.drawnIds.includes(reason.id);

                                    return (
                                        <motion.div
                                            key={reason.id}
                                            initial={{ scale: 0 }}
                                            animate={isPicking ? {
                                                y: -300,
                                                x: [0, -8, 12, -4, 0],
                                                rotate: [transform.rotate, -20, 25, -10, 0],
                                                scale: [1, 1.3, 1.5, 1.2],
                                                opacity: [1, 1, 0.8, 0],
                                            } : {
                                                scale: 1,
                                                rotate: transform.rotate,
                                                y: transform.y,
                                            }}
                                            transition={isPicking
                                                ? { duration: 0.8, ease: "easeOut" }
                                                : { type: "spring", stiffness: 200, damping: 15 }
                                            }
                                            whileHover={(!isAdmin && canDraw) || isAdmin ? {
                                                scale: 1.4,
                                                rotate: 0,
                                                zIndex: 30,
                                                y: -3,
                                            } : {}}
                                            whileTap={(!isAdmin && canDraw) ? { scale: 0.9 } : {}}
                                            onClick={() => handlePaperPick(reason, idx)}
                                            className={`w-4 h-5 sm:w-6 sm:h-7 rounded-[2px] shadow-md flex items-center justify-center relative shrink-0 transition-opacity ${
                                                (canDraw || isAdmin) ? 'cursor-pointer' : ''
                                            } ${wasDrawnToday && !isAdmin ? 'opacity-30' : ''}`}
                                            style={{ backgroundColor: getColorForReason(reason, idx) }}
                                        >
                                            <Heart className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 text-black/15" />

                                            {/* Admin delete */}
                                            {isAdmin && (
                                                <button
                                                    onClick={(e) => handleDeleteReason(reason.id, e)}
                                                    className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/paper:opacity-100 transition-opacity hover:bg-red-500"
                                                >
                                                    <X className="w-1.5 h-1.5 text-white" />
                                                </button>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* Falling animation (admin add) */}
                        <AnimatePresence>
                            {fallingNote && (
                                <motion.div
                                    initial={{ y: -120, x: 0, rotate: 0, opacity: 1 }}
                                    animate={{ y: 250, x: [0, 15, -15, 8, -8, 0], rotate: 720, opacity: [1, 1, 0.8] }}
                                    transition={{ duration: 1.2, ease: "easeIn" }}
                                    className="absolute left-1/2 -translate-x-1/2 w-6 h-7 rounded-[2px] shadow-xl z-50"
                                    style={{ backgroundColor: fallingNote.color }}
                                >
                                    <Heart className="w-2.5 h-2.5 text-black/15 m-auto mt-2" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Reflections */}
                        <div className="absolute top-12 left-8 w-1.5 h-44 sm:h-52 rounded-full blur-[2px]" style={{ backgroundColor: 'var(--jar-reflection)' }} />
                        <div className="absolute top-24 right-10 w-1 h-24 sm:h-32 rounded-full blur-[1px]" style={{ backgroundColor: 'var(--jar-reflection)' }} />
                    </div>

                    {/* Jar Heart Label */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-32 sm:h-32 pointer-events-none opacity-20">
                        <Heart className="w-full h-full" style={{ color: 'var(--jar-border)' }} fill="currentColor" />
                    </div>
                </div>

                {/* Controls for Ratih */}
                {!isAdmin && (
                    <div className="relative z-10 text-center mt-3 space-y-3">
                        {jarDirty ? (
                            <p className="text-[10px] uppercase tracking-[0.3em] animate-pulse" style={{ color: 'var(--text-muted)' }}>
                                Bersihin jar-nya dulu ya...
                            </p>
                        ) : canDraw ? (
                            <>
                                <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
                                    {drawsLeft} kesempatan lagi hari ini
                                </p>
                                {dailyState.inPenalty && (
                                    <p className="text-[9px] italic" style={{ color: 'var(--text-muted)' }}>
                                        ⚠️ Cuma {maxDraws} kertas/hari sampai streak 3
                                    </p>
                                )}
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
                                        Kamu udah buka {maxDraws} kertas hari ini
                                    </p>
                                </div>
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                    Balik lagi besok ya — <span style={{ color: 'var(--accent)' }}>{countdown}</span>
                                </p>
                            </div>
                        )}

                        {/* Koleksi Button */}
                        {collection.length > 0 && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => setShowCollection(true)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-full glass mx-auto transition-all"
                            >
                                <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    Koleksi ({collection.length})
                                </span>
                            </motion.button>
                        )}
                    </div>
                )}

                {/* Admin — bottom text + reset */}
                {isAdmin && (
                    <div className="text-center relative z-10 max-w-xs mt-2 space-y-3">
                        <p className="text-[10px] uppercase tracking-[0.4em]" style={{ color: 'var(--text-muted)' }}>
                            {loading ? "Loading..." : `${reasons.length} notes inside`}
                        </p>
                        <button
                            onClick={() => {
                                if (!window.confirm('Reset streak, koleksi, dan daily draws Ratih ke 0?')) return;
                                const freshState: DailyState = { date: getTodayStr(), draws: 0, drawnIds: [], streak: 0, lastDate: '', brokeStreak: false, inPenalty: false, jarCleaned: false };
                                saveDailyState(freshState);
                                setDailyState(freshState);
                                saveCollection([]);
                                setCollection([]);
                                localStorage.removeItem('lovejar_reward30');
                                localStorage.removeItem('lovejar_reward14');
                                setRewardClaimed(false);
                                setReward14Claimed(false);
                                alert('✅ Reset berhasil! Streak, koleksi & reward Ratih sudah di-reset.');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full mx-auto text-red-400 border border-red-400/30 hover:bg-red-500/10 transition-all"
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span className="text-[9px] uppercase tracking-widest">Reset Ratih</span>
                        </button>
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
                            initial={{ scale: 0.2, y: 150, rotate: -20 }}
                            animate={{ scale: 1, y: 0, rotate: 0 }}
                            exit={{ scale: 0.5, y: 40, opacity: 0 }}
                            transition={{ type: "spring", damping: 14, stiffness: 180 }}
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
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                                >
                                    <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-black/20 mx-auto mb-6 sm:mb-8" fill="currentColor" />
                                </motion.div>

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="text-xl sm:text-2xl md:text-3xl font-serif italic text-black/80 leading-relaxed"
                                >
                                    &ldquo;{currentReason.text}&rdquo;
                                </motion.p>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.45 }}
                                    className="mt-8 sm:mt-12 flex items-center justify-center gap-2"
                                >
                                    <div className="w-10 h-[1px] bg-black/10" />
                                    <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-black/40 font-medium">
                                        — {currentReason.author || "Love Note"} —
                                    </p>
                                    <div className="w-10 h-[1px] bg-black/10" />
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

            {/* Collection Modal */}
            <AnimatePresence>
                {showCollection && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowCollection(false)}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-2xl"
                        style={{ backgroundColor: 'var(--modal-overlay)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            className="w-full max-w-lg max-h-[80vh] rounded-[2rem] border overflow-hidden flex flex-col"
                            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 pb-3 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
                                <div>
                                    <h3 className="text-lg font-serif italic" style={{ color: 'var(--text-primary)' }}>
                                        Koleksi Cinta 📖
                                    </h3>
                                    <p className="text-[10px] mt-1 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                        {collection.length} dari {reasons.length} kertas sudah dibaca
                                    </p>
                                </div>
                                <button onClick={() => setShowCollection(false)}>
                                    <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                </button>
                            </div>

                            {/* Notes Grid */}
                            <div className="flex-1 overflow-y-auto p-4 pt-3 space-y-3 no-scrollbar">
                                {collection.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Heart className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
                                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                            Belum ada kertas yang dibuka~
                                        </p>
                                    </div>
                                ) : (
                                    [...collection].reverse().map((item, i) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            onClick={() => {
                                                setShowCollection(false);
                                                setCurrentReason({ id: item.id, text: item.text, color: item.color, author: item.author, created_at: item.openedAt });
                                                setIsOpen(true);
                                            }}
                                            className="p-4 rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform shadow-sm"
                                            style={{ backgroundColor: item.color }}
                                        >
                                            <p className="text-sm font-serif italic text-black/70 line-clamp-2">
                                                &ldquo;{item.text}&rdquo;
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <p className="text-[9px] text-black/40">
                                                    — {item.author || "Love Note"}
                                                </p>
                                                <p className="text-[9px] text-black/30">
                                                    {new Date(item.openedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Streak Tracker Modal */}
            <AnimatePresence>
                {showStreakTracker && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setShowStreakTracker(false); setStreakRewardDay(null); }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-2xl"
                        style={{ backgroundColor: 'var(--modal-overlay)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            className="w-full max-w-sm rounded-[2rem] border overflow-hidden"
                            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-5 pb-3 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
                                <div>
                                    <h3 className="text-lg font-serif italic flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        <Flame className="w-5 h-5 text-orange-400" /> Streak Journey
                                    </h3>
                                    <p className="text-[10px] mt-1 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                        {dailyState.streak} / 30 hari
                                    </p>
                                </div>
                                <button onClick={() => { setShowStreakTracker(false); setStreakRewardDay(null); }}>
                                    <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                </button>
                            </div>

                            {/* 30 Day Grid */}
                            <div className="p-5 pb-4">
                                <div className="grid grid-cols-6 gap-2">
                                    {Array.from({ length: 30 }, (_, i) => {
                                        const day = i + 1;
                                        const isReached = dailyState.streak >= day;
                                        const isToday = dailyState.streak === day;
                                        const isRewardDay = day === 14 || day === 30;
                                        const rewardUnlocked = isRewardDay && isReached;
                                        const rewardAlreadyClaimed = day === 14 ? reward14Claimed : rewardClaimed;

                                        return (
                                            <motion.button
                                                key={day}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: i * 0.02 }}
                                                onClick={() => {
                                                    if (rewardUnlocked) setStreakRewardDay(day);
                                                }}
                                                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all ${
                                                    isRewardDay
                                                        ? rewardUnlocked
                                                            ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900 shadow-lg cursor-pointer ring-2 ring-amber-400/50'
                                                            : 'border-2 border-dashed border-amber-400/40 text-amber-400/60'
                                                        : isReached
                                                            ? 'shadow-sm text-white'
                                                            : 'border text-opacity-40'
                                                }`}
                                                style={{
                                                    ...(isReached && !isRewardDay ? { backgroundColor: 'var(--accent)' } : {}),
                                                    ...(!isReached && !isRewardDay ? { borderColor: 'var(--border)', color: 'var(--text-muted)' } : {}),
                                                }}
                                            >
                                                {isRewardDay ? (
                                                    <>
                                                        <Gift className={`w-3.5 h-3.5 ${rewardUnlocked ? '' : 'opacity-50'}`} />
                                                        <span className="text-[8px] mt-0.5">{day}</span>
                                                        {rewardUnlocked && rewardAlreadyClaimed && (
                                                            <span className="absolute -top-1 -right-1 text-[10px]">✅</span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{day}</span>
                                                        {isReached && <span className="text-[7px] mt-0.5">✓</span>}
                                                    </>
                                                )}
                                                {isToday && (
                                                    <motion.div
                                                        className="absolute inset-0 rounded-xl border-2"
                                                        style={{ borderColor: 'var(--accent)' }}
                                                        animate={{ scale: [1, 1.1, 1], opacity: [1, 0.5, 1] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                    />
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Progress bar */}
                                <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((dailyState.streak / 30) * 100, 100)}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500"
                                    />
                                </div>
                                <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-muted)' }}>
                                    {dailyState.streak >= 30
                                        ? '🎉 Kamu berhasil 30 hari!'
                                        : `${30 - dailyState.streak} hari lagi menuju hadiah terakhir`}
                                </p>
                            </div>

                            {/* Reward Card (shown when tapping reward day) */}
                            <AnimatePresence>
                                {streakRewardDay !== null && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="mx-5 mb-5 p-5 rounded-2xl text-center"
                                        style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}
                                    >
                                        <Gift className="w-10 h-10 text-amber-700 mx-auto mb-3" />
                                        <h4 className="text-base font-serif italic text-amber-900 mb-1">
                                            🎁 Hadiah Streak {streakRewardDay} Hari!
                                        </h4>
                                        <p className="text-sm text-amber-800/70 mb-4">
                                            {streakRewardDay === 14
                                                ? 'Kamu udah 14 hari berturut-turut buka jar! Ezi punya hadiah buat kamu 🥰'
                                                : 'WOW 30 hari! Kamu luar biasa sayang 🥺💝 Ezi punya sesuatu yang spesial buat kamu!'}
                                        </p>
                                        <a
                                            href="https://wa.me/6285156161724?text=Ezi%20aku%20udah%20streak%20"
                                            onClick={() => {
                                                if (streakRewardDay === 14) {
                                                    claimReward14();
                                                    setReward14Claimed(true);
                                                } else {
                                                    claimReward30();
                                                    setRewardClaimed(true);
                                                }
                                                setStreakRewardDay(null);
                                            }}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors shadow-lg"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Chat Ezi di WhatsApp 💬
                                        </a>
                                        <p className="text-[9px] text-amber-700/50 mt-3">
                                            Bilang ke Ezi buat claim hadiahmu~
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 30 Day Streak Reward */}
            <AnimatePresence>
                {showReward && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center p-4 backdrop-blur-3xl"
                        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", damping: 12, stiffness: 150 }}
                            className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-[2.5rem] p-8 sm:p-10 relative text-center no-scrollbar"
                            style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 30%, #fbbf24 100%)' }}
                        >
                            {/* Sparkle effects */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
                                {[...Array(8)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute text-2xl"
                                        style={{ left: `${10 + (i * 11)}%`, top: `${5 + ((i * 17) % 80)}%` }}
                                        animate={{ scale: [0.5, 1, 0.5], opacity: [0.3, 1, 0.3], rotate: [0, 180, 360] }}
                                        transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
                                    >
                                        ✨
                                    </motion.div>
                                ))}
                            </div>

                            <div className="relative z-10">
                                <motion.div
                                    initial={{ y: -30, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <Gift className="w-16 h-16 text-amber-700 mx-auto mb-4" />
                                </motion.div>

                                <motion.h2
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-2xl sm:text-3xl font-serif italic text-amber-900 mb-2"
                                >
                                    🎉 30 Hari Streak!
                                </motion.h2>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                    className="text-xs text-amber-700/60 uppercase tracking-widest mb-8"
                                >
                                    Hadiah spesial dari Ezi
                                </motion.p>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1 }}
                                    className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-left space-y-4"
                                >
                                    <p className="text-sm sm:text-base text-amber-900/80 font-serif italic leading-relaxed">
                                        Sayang,
                                    </p>
                                    <p className="text-sm sm:text-base text-amber-900/80 font-serif italic leading-relaxed">
                                        30 hari berturut-turut kamu buka jar ini...
                                        Aku nggak nyangka kamu bakal sesabar dan sesetia ini. 🥺
                                    </p>
                                    <p className="text-sm sm:text-base text-amber-900/80 font-serif italic leading-relaxed">
                                        Setiap kertas yang kamu buka, itu bukan cuma tulisan—
                                        itu isi hati aku yang pengen kamu tau.
                                    </p>
                                    <p className="text-sm sm:text-base text-amber-900/80 font-serif italic leading-relaxed">
                                        Terima kasih udah mau baca, mau ngerti, mau ada.
                                        Kamu adalah alasan kenapa aku nulis semua itu.
                                    </p>
                                    <p className="text-sm sm:text-base text-amber-900/80 font-serif italic leading-relaxed">
                                        Aku sayang kamu, lebih dari yang bisa aku tulis
                                        di 1000 kertas sekalipun. 💝
                                    </p>
                                    <div className="text-right pt-2">
                                        <p className="text-sm text-amber-800/60 font-serif italic">
                                            Selamanya milik kamu,
                                        </p>
                                        <p className="text-lg text-amber-900 font-serif italic font-medium">
                                            — Ezi
                                        </p>
                                    </div>
                                </motion.div>

                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.5 }}
                                    onClick={() => {
                                        claimReward30();
                                        setRewardClaimed(true);
                                        setShowReward(false);
                                        setShowConfetti(true);
                                        setTimeout(() => setShowConfetti(false), 4000);
                                    }}
                                    className="mt-8 px-8 py-3 rounded-full bg-amber-800 text-amber-50 text-sm font-medium hover:bg-amber-900 transition-colors shadow-lg"
                                >
                                    💝 Terima Kasih, Ezi
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Guilt-trip Sad Message */}
            <AnimatePresence>
                {showSadMessage && guiltMessage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowSadMessage(false)}
                        className="fixed inset-0 z-[160] flex items-center justify-center p-6 backdrop-blur-2xl"
                        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.5, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", damping: 15 }}
                            className="p-8 sm:p-10 rounded-[2.5rem] max-w-xs w-full text-center border"
                            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <motion.p
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="text-5xl mb-5"
                            >
                                {guiltMessage.emoji}
                            </motion.p>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-sm font-serif italic leading-relaxed"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {guiltMessage.text}
                            </motion.p>
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                onClick={() => setShowSadMessage(false)}
                                className="mt-6 px-6 py-2.5 rounded-full text-xs font-medium transition-colors"
                                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                            >
                                Maaf ya... 🥺
                            </motion.button>
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
