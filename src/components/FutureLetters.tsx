"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, MailOpen, Clock, Plus, X, Send, Trash2, Gift, Heart } from "lucide-react";
import { FutureLetter } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/admin-context";
import { sendPushNotification } from "@/lib/push-notifications";

// === Circular Countdown Ring ===
function CountdownRing({ dateStr, now }: { dateStr: string; now: Date }) {
    const diff = new Date(dateStr).getTime() - now.getTime();
    if (diff <= 0) return null;

    const totalDays = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const displayNum = totalDays > 0 ? totalDays : hours;
    const displayLabel = totalDays > 0 ? "hari" : "jam";

    const maxDays = 90;
    const progress = Math.max(0, Math.min(1, 1 - totalDays / maxDays));
    const r = 20;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - progress);

    return (
        <div className="relative w-14 h-14 shrink-0">
            <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth="2.5" opacity="0.3" />
                <motion.circle
                    cx="28" cy="28" r={r} fill="none"
                    stroke="var(--accent)" strokeWidth="2.5"
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                    transform="rotate(-90 28 28)"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-bold leading-none" style={{ color: "var(--accent)" }}>
                    {displayNum}
                </span>
                <span className="text-[6px] uppercase tracking-wider mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {displayLabel}
                </span>
            </div>
        </div>
    );
}

export function FutureLetters() {
    const { isAdmin, authorName } = useAdmin();
    const [letters, setLetters] = useState<FutureLetter[]>([]);
    const [selectedLetter, setSelectedLetter] = useState<FutureLetter | null>(null);
    const [isWriting, setIsWriting] = useState(false);
    const [newLetter, setNewLetter] = useState({ title: "", content: "", unlockDate: "" });
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [isFirstOpen, setIsFirstOpen] = useState(false);

    useEffect(() => {
        fetchLetters();
        tickRef.current = setInterval(() => setNow(new Date()), 60000);
        return () => { if (tickRef.current) clearInterval(tickRef.current); };
    }, []);

    const fetchLetters = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("future_letters")
            .select("*")
            .order("unlock_date", { ascending: true });
        if (data) setLetters(data);
        setLoading(false);
    };

    const isLocked = (dateStr: string) => new Date(dateStr) > now;

    const getCountdown = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - now.getTime();
        if (diff <= 0) return "Siap dibuka ✨";
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        if (days > 0) return `${days} hari ${hours} jam lagi`;
        if (hours > 0) return `${hours} jam ${mins} menit lagi`;
        return `${mins} menit lagi`;
    };

    const handleOpenLetter = async (letter: FutureLetter) => {
        const locked = isLocked(letter.unlock_date);
        if (locked && !isAdmin) return;

        if (!locked && !letter.is_opened) {
            setIsFirstOpen(true);
            await supabase.from("future_letters").update({ is_opened: true }).eq("id", letter.id);
            setLetters(prev => prev.map(l => l.id === letter.id ? { ...l, is_opened: true } : l));
            setSelectedLetter({ ...letter, is_opened: true });
        } else {
            setIsFirstOpen(false);
            setSelectedLetter(letter);
        }
    };

    const handleWriteLetter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLetter.title || !newLetter.content || !newLetter.unlockDate) return;

        const { data } = await supabase
            .from("future_letters")
            .insert([{
                title: newLetter.title,
                content: newLetter.content,
                unlock_date: new Date(newLetter.unlockDate).toISOString(),
                is_opened: false,
                author: authorName,
            }])
            .select();

        if (data) {
            setLetters(prev => [...prev, data[0]].sort((a, b) => new Date(a.unlock_date).getTime() - new Date(b.unlock_date).getTime()));
            setNewLetter({ title: "", content: "", unlockDate: "" });
            setIsWriting(false);
            sendPushNotification({ author: authorName, title: "✉️ Surat Baru!", body: "Ada surat baru menunggu untuk dibuka", url: "/secret-space", tag: "future-letter" });
        }
    };

    const handleDeleteLetter = async (id: string) => {
        if (!confirm("Hapus surat ini?")) return;
        try {
            const { data, error } = await supabase.from("future_letters").delete().eq("id", id).select();
            if (error) throw error;
            if (!data || data.length === 0) throw new Error("Delete blocked");
            setLetters(prev => prev.filter(l => l.id !== id));
            if (selectedLetter?.id === id) setSelectedLetter(null);
        } catch (error) {
            console.error("Error deleting letter:", error);
            alert("Gagal hapus surat.");
        }
    };

    const unlockedLetters = letters.filter(l => !isLocked(l.unlock_date));
    const lockedLetters = letters.filter(l => isLocked(l.unlock_date));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-3">
                <div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "var(--accent)" }} />
                        <h2 className="text-xl sm:text-2xl font-light font-serif italic" style={{ color: "var(--text-secondary)" }}>
                            Future Letters
                        </h2>
                    </div>
                    <p className="text-[9px] uppercase tracking-[0.3em] mt-1 pl-7" style={{ color: "var(--text-muted)" }}>
                        Surat-surat dari masa depan
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setIsWriting(true)}
                        className="glass px-4 py-2 rounded-full text-xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <Plus className="w-3 h-3" />
                        Tulis Surat
                    </button>
                )}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse rounded-2xl p-6 space-y-3" style={{ backgroundColor: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full" style={{ backgroundColor: "var(--input-bg)" }} />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/3 rounded" style={{ backgroundColor: "var(--input-bg)" }} />
                                    <div className="h-2 w-1/5 rounded" style={{ backgroundColor: "var(--input-bg)" }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : letters.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{ border: "1px dashed var(--border)" }}>
                    <Gift className="w-8 h-8 mx-auto mb-4" style={{ color: "var(--text-faint)" }} />
                    <p className="text-sm font-serif italic" style={{ color: "var(--text-faint)" }}>
                        {isAdmin ? "Belum ada surat. Tulis yang pertama!" : "Belum ada surat... Sesuatu yang spesial akan datang ✨"}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* ===== UNLOCKED LETTERS ===== */}
                    {unlockedLetters.length > 0 && (
                        <div className="space-y-3">
                            {unlockedLetters.map((letter, i) => (
                                <motion.div
                                    key={letter.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    onClick={() => handleOpenLetter(letter)}
                                    className="relative p-5 sm:p-6 rounded-2xl border cursor-pointer overflow-hidden group"
                                    style={{
                                        backgroundColor: letter.is_opened ? "var(--glass-bg)" : "#fcfaf2",
                                        borderColor: letter.is_opened ? "var(--border)" : "var(--accent)",
                                    }}
                                >
                                    {/* Glow + sparkle for unopened */}
                                    {!letter.is_opened && (
                                        <>
                                            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(160,107,62,0.08), transparent 60%)" }} />
                                            <motion.div
                                                className="absolute top-3 right-3 text-lg"
                                                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                ✨
                                            </motion.div>
                                        </>
                                    )}

                                    <div className="relative z-10 flex items-center gap-4">
                                        {/* Icon */}
                                        <div
                                            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${letter.is_opened ? "" : "shadow-md"}`}
                                            style={{
                                                backgroundColor: letter.is_opened ? "var(--input-bg)" : "var(--accent-soft)",
                                                border: letter.is_opened ? "none" : "1px solid var(--accent)",
                                            }}
                                        >
                                            {letter.is_opened
                                                ? <MailOpen className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                                                : <Gift className="w-5 h-5" style={{ color: "var(--accent)" }} />
                                            }
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-medium truncate" style={{ color: letter.is_opened ? "var(--text-primary)" : "#3d2c1a" }}>
                                                {letter.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                {letter.author && (
                                                    <span className="text-[10px] font-serif italic" style={{ color: letter.is_opened ? "var(--text-faint)" : "#8b6f47" }}>
                                                        dari {letter.author}
                                                    </span>
                                                )}
                                                <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: letter.is_opened ? "var(--text-faint)" : "var(--accent)" }}>
                                                    {letter.is_opened ? "Sudah dibaca" : "✨ Tap untuk buka!"}
                                                </span>
                                            </div>
                                        </div>

                                        {isAdmin && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteLetter(letter.id); }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 p-1"
                                                style={{ color: "var(--text-faint)" }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* ===== DIVIDER ===== */}
                    {unlockedLetters.length > 0 && lockedLetters.length > 0 && (
                        <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 h-[1px]" style={{ backgroundColor: "var(--border)" }} />
                            <Lock className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
                            <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Masih Tersegel</span>
                            <div className="flex-1 h-[1px]" style={{ backgroundColor: "var(--border)" }} />
                        </div>
                    )}

                    {/* ===== LOCKED LETTERS (Sealed Envelopes) ===== */}
                    {lockedLetters.length > 0 && (
                        <div className="space-y-3">
                            {lockedLetters.map((letter, i) => (
                                <motion.div
                                    key={letter.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    whileHover={isAdmin ? { y: -3 } : {}}
                                    onClick={() => isAdmin && handleOpenLetter(letter)}
                                    className={`relative p-5 sm:p-6 rounded-2xl border overflow-hidden group ${isAdmin ? "cursor-pointer" : ""}`}
                                    style={{ backgroundColor: "var(--glass-bg)", borderColor: "var(--border)" }}
                                >
                                    {/* Envelope fold decoration */}
                                    <div className="absolute top-0 left-0 right-0 h-14 pointer-events-none overflow-hidden opacity-[0.04]">
                                        <div className="absolute top-0 left-0 right-1/2 h-14 border-b border-r border-current" style={{ transform: "skewY(5deg)", transformOrigin: "top right" }} />
                                        <div className="absolute top-0 left-1/2 right-0 h-14 border-b border-l border-current" style={{ transform: "skewY(-5deg)", transformOrigin: "top left" }} />
                                    </div>

                                    <div className="relative z-10 flex items-center gap-4">
                                        {/* Countdown Ring */}
                                        <CountdownRing dateStr={letter.unlock_date} now={now} />

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-medium truncate" style={{ color: "var(--text-muted)" }}>
                                                {isAdmin ? letter.title : "Sebuah kejutan menunggu..."}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Lock className="w-2.5 h-2.5" style={{ color: "var(--text-faint)" }} />
                                                <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
                                                    {getCountdown(letter.unlock_date)}
                                                </span>
                                            </div>
                                            <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>
                                                Terbuka {new Date(letter.unlock_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                                            </p>
                                        </div>

                                        {/* Wax Seal */}
                                        <div className="relative shrink-0">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-red-700 flex items-center justify-center shadow-lg">
                                                <Heart className="w-3.5 h-3.5 text-red-100/80" fill="currentColor" />
                                            </div>
                                            <motion.div
                                                className="absolute inset-0 rounded-full"
                                                style={{ boxShadow: "0 0 12px rgba(239,68,68,0.3)" }}
                                                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 2.5, repeat: Infinity }}
                                            />
                                        </div>

                                        {isAdmin && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteLetter(letter.id); }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 p-1"
                                                style={{ color: "var(--text-faint)" }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ===== READ LETTER MODAL (Envelope Opening Animation) ===== */}
            <AnimatePresence>
                {selectedLetter && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setSelectedLetter(null); setIsFirstOpen(false); }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl"
                        style={{ backgroundColor: "var(--modal-overlay)" }}
                    >
                        <motion.div
                            initial={{
                                scale: isFirstOpen ? 0.15 : 0.85,
                                y: isFirstOpen ? 100 : 30,
                                rotate: isFirstOpen ? -8 : -1,
                                opacity: 0,
                            }}
                            animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
                            exit={{ scale: 0.5, y: 40, opacity: 0 }}
                            transition={{
                                type: "spring",
                                damping: isFirstOpen ? 14 : 18,
                                stiffness: isFirstOpen ? 120 : 200,
                            }}
                            className="bg-[#fcfaf2] p-6 sm:p-8 md:p-16 rounded-sm max-w-2xl w-full text-zinc-800 shadow-[0_0_120px_rgba(0,0,0,0.5)] relative min-h-[400px] sm:min-h-[500px] overflow-y-auto max-h-[90vh] flex flex-col items-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Paper texture */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />

                            {/* Envelope fold decoration at top */}
                            <div className="absolute top-0 left-0 right-0 h-20 pointer-events-none overflow-hidden">
                                <div className="absolute top-0 left-0 right-1/2 h-20 border-b border-zinc-200/60" style={{ transform: "skewY(4deg)", transformOrigin: "top right" }} />
                                <div className="absolute top-0 left-1/2 right-0 h-20 border-b border-zinc-200/60" style={{ transform: "skewY(-4deg)", transformOrigin: "top left" }} />
                            </div>

                            {/* Wax seal breaking animation (first open only) */}
                            {isFirstOpen && (
                                <motion.div
                                    className="absolute top-6 left-1/2 -translate-x-1/2 z-30"
                                    initial={{ scale: 1.5, opacity: 1 }}
                                    animate={{ scale: [1.5, 2, 0], opacity: [1, 0.6, 0], rotate: [0, 0, 120] }}
                                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                                >
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-400 to-red-700 flex items-center justify-center shadow-2xl">
                                        <Heart className="w-6 h-6 text-red-100/80" fill="currentColor" />
                                    </div>
                                </motion.div>
                            )}

                            {/* Close button */}
                            <div className="w-full flex justify-end mb-8 relative z-10">
                                <button
                                    onClick={() => { setSelectedLetter(null); setIsFirstOpen(false); }}
                                    className="text-zinc-400 hover:text-zinc-800 transition-colors uppercase tracking-[0.3em] text-[10px]"
                                >
                                    Tutup
                                </button>
                            </div>

                            {/* Letter Content (staggered reveal) */}
                            <div className="w-full max-w-prose relative z-10">
                                <motion.div
                                    className="mb-12 text-center"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: isFirstOpen ? 0.8 : 0.15 }}
                                >
                                    <div className="inline-block px-5 py-1.5 border-y border-zinc-200 mb-8">
                                        <span className="text-[10px] uppercase tracking-[0.5em] text-zinc-400">
                                            {selectedLetter.author ? `Surat dari ${selectedLetter.author}` : "Surat Rahasia"}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif italic mb-4 leading-tight">
                                        {selectedLetter.title}
                                    </h2>
                                    <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest">
                                        {new Date(selectedLetter.unlock_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: isFirstOpen ? 1.2 : 0.25 }}
                                    className="prose prose-zinc leading-[2] font-serif text-lg sm:text-xl text-zinc-700 whitespace-pre-wrap first-letter:text-5xl first-letter:float-left first-letter:mr-3 first-letter:pt-2 first-letter:font-serif"
                                >
                                    {selectedLetter.content}
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: isFirstOpen ? 1.8 : 0.45 }}
                                    className="mt-20 pt-10 border-t border-zinc-100 text-center"
                                >
                                    <p className="font-serif italic text-zinc-400 text-lg">
                                        Selalu milikmu{selectedLetter.author ? `, ${selectedLetter.author}` : ""}.
                                    </p>
                                </motion.div>
                            </div>

                            {/* Decorative corner */}
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-zinc-100/50 to-transparent pointer-events-none" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== WRITE LETTER MODAL ===== */}
            <AnimatePresence>
                {isWriting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md"
                        style={{ backgroundColor: "var(--modal-overlay)" }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl max-w-lg w-full border"
                            style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-serif italic font-light" style={{ color: "var(--text-primary)" }}>Surat Baru</h3>
                                <button onClick={() => setIsWriting(false)}>
                                    <X className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                                </button>
                            </div>
                            <form onSubmit={handleWriteLetter} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Judul surat (e.g., Buat Ratih yang Lagi Capek)"
                                    value={newLetter.title}
                                    onChange={(e) => setNewLetter({ ...newLetter, title: e.target.value })}
                                    className="w-full rounded-xl p-4 text-sm outline-none"
                                    style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                                />
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest pl-1" style={{ color: "var(--text-muted)" }}>Tanggal Buka</label>
                                    <input
                                        type="date"
                                        value={newLetter.unlockDate}
                                        onChange={(e) => setNewLetter({ ...newLetter, unlockDate: e.target.value })}
                                        className="w-full rounded-xl p-4 text-sm outline-none"
                                        style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                                    />
                                </div>
                                <textarea
                                    placeholder="Tulis pesan kamu di sini..."
                                    value={newLetter.content}
                                    onChange={(e) => setNewLetter({ ...newLetter, content: e.target.value })}
                                    className="w-full h-48 rounded-xl p-4 text-sm outline-none resize-none"
                                    style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                                />
                                <button
                                    type="submit"
                                    className="w-full p-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                    style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                                >
                                    <Send className="w-4 h-4" />
                                    Segel Surat ✉️
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
