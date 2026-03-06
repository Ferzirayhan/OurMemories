"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, MailOpen, Clock, Plus, X, Send, Trash2, Unlock, Gift } from "lucide-react";
import { FutureLetter } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/admin-context";
import { sendPushNotification } from "@/lib/push-notifications";

export function FutureLetters() {
    const { isAdmin, authorName } = useAdmin();
    const [letters, setLetters] = useState<FutureLetter[]>([]);
    const [selectedLetter, setSelectedLetter] = useState<FutureLetter | null>(null);
    const [isWriting, setIsWriting] = useState(false);
    const [newLetter, setNewLetter] = useState({ title: "", content: "", unlockDate: "" });
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        fetchLetters();
        // Live countdown tick every minute
        tickRef.current = setInterval(() => setNow(new Date()), 60000);
        return () => { if (tickRef.current) clearInterval(tickRef.current); };
    }, []);

    const fetchLetters = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('future_letters')
            .select('*')
            .order('unlock_date', { ascending: true });

        if (data) setLetters(data);
        setLoading(false);
    };

    const isLocked = (dateStr: string) => {
        return new Date(dateStr) > now;
    };

    const getCountdown = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - now.getTime();
        if (diff <= 0) return "Ready to open ✨";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (days > 0) return `${days}d ${hours}h left`;
        if (hours > 0) return `${hours}h ${mins}m left`;
        return `${mins}m left`;
    };

    const handleOpenLetter = async (letter: FutureLetter) => {
        const locked = isLocked(letter.unlock_date);

        // Only Ratih is blocked by lock
        if (locked && !isAdmin) return;

        // Mark as opened in DB only if date has passed and not already opened
        if (!locked && !letter.is_opened) {
            await supabase
                .from('future_letters')
                .update({ is_opened: true })
                .eq('id', letter.id);

            setLetters(prev => prev.map(l => l.id === letter.id ? { ...l, is_opened: true } : l));
            setSelectedLetter({ ...letter, is_opened: true });
        } else {
            setSelectedLetter(letter);
        }
    };

    const handleWriteLetter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLetter.title || !newLetter.content || !newLetter.unlockDate) return;

        const { data } = await supabase
            .from('future_letters')
            .insert([{
                title: newLetter.title,
                content: newLetter.content,
                unlock_date: new Date(newLetter.unlockDate).toISOString(),
                is_opened: false,
                author: authorName
            }])
            .select();

        if (data) {
            setLetters(prev => [...prev, data[0]].sort((a, b) => new Date(a.unlock_date).getTime() - new Date(b.unlock_date).getTime()));
            setNewLetter({ title: "", content: "", unlockDate: "" });
            setIsWriting(false);
            sendPushNotification({ author: authorName, title: "✉️ New Future Letter!", body: "A new letter is waiting to be unlocked", url: "/secret-space", tag: "future-letter" });
        }
    };

    const handleDeleteLetter = async (id: string) => {
        if (!confirm("Hapus surat ini?")) return;
        try {
            const { data, error } = await supabase
                .from('future_letters')
                .delete()
                .eq('id', id)
                .select();
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Delete blocked');
            setLetters(prev => prev.filter(l => l.id !== id));
            if (selectedLetter?.id === id) setSelectedLetter(null);
        } catch (error) {
            console.error("Error deleting letter:", error);
            alert("Gagal hapus surat.");
        }
    };

    // Separate letters by status
    const unlockedLetters = letters.filter(l => !isLocked(l.unlock_date));
    const lockedLetters = letters.filter(l => isLocked(l.unlock_date));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--accent)' }} />
                    <h2 className="text-xl sm:text-2xl font-light font-serif italic" style={{ color: 'var(--text-secondary)' }}>Future Letters</h2>
                </div>
                {/* Only admin can write */}
                {isAdmin && (
                    <button
                        onClick={() => setIsWriting(true)}
                        className="glass px-4 py-2 rounded-full text-xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <Plus className="w-3 h-3" />
                        Write Letter
                    </button>
                )}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse rounded-2xl p-5 space-y-3" style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--border)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--input-bg)' }} />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/3 rounded" style={{ backgroundColor: 'var(--input-bg)' }} />
                                    <div className="h-2 w-1/5 rounded" style={{ backgroundColor: 'var(--input-bg)' }} />
                                </div>
                            </div>
                            <div className="h-3 w-2/3 rounded" style={{ backgroundColor: 'var(--input-bg)' }} />
                        </div>
                    ))}
                </div>
            ) : letters.length === 0 ? (
                <div className="text-center py-12 rounded-2xl" style={{ border: '1px dashed var(--border)' }}>
                    <Gift className="w-6 h-6 mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
                    <p className="text-sm font-serif italic" style={{ color: 'var(--text-faint)' }}>
                        {isAdmin ? "Belum ada surat. Tulis yang pertama!" : "No letters yet. Something special is coming..."}
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Unlocked / Ready to open */}
                    {unlockedLetters.length > 0 && (
                        <div className="space-y-3">
                            {unlockedLetters.map((letter) => (
                                <motion.div
                                    key={letter.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ y: -3 }}
                                    onClick={() => handleOpenLetter(letter)}
                                    className="p-5 sm:p-6 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group"
                                    style={{
                                        backgroundColor: 'var(--glass-bg)',
                                        borderColor: letter.is_opened ? 'var(--border)' : 'var(--accent)',
                                    }}
                                >
                                    {/* Glow for unopened */}
                                    {!letter.is_opened && (
                                        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, var(--accent-soft), transparent 60%)' }} />
                                    )}
                                    <div className="relative z-10 flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: letter.is_opened ? 'var(--input-bg)' : 'var(--accent-soft)' }}>
                                            {letter.is_opened
                                                ? <MailOpen className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                                : <Gift className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-medium truncate" style={{ color: 'var(--text-primary)' }}>{letter.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                {letter.author && <span className="text-[10px] font-serif italic" style={{ color: 'var(--text-faint)' }}>from {letter.author}</span>}
                                                <span className="text-[10px] uppercase tracking-widest" style={{ color: letter.is_opened ? 'var(--text-faint)' : 'var(--accent)' }}>
                                                    {letter.is_opened ? "Opened" : "✨ Tap to open!"}
                                                </span>
                                            </div>
                                        </div>
                                        {isAdmin && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteLetter(letter.id); }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 p-1"
                                                style={{ color: 'var(--text-faint)' }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Locked / Coming soon */}
                    {lockedLetters.length > 0 && (
                        <div className="space-y-3">
                            {unlockedLetters.length > 0 && (
                                <div className="flex items-center gap-3 my-4">
                                    <div className="flex-1 h-[1px]" style={{ backgroundColor: 'var(--border)' }} />
                                    <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Coming Soon</span>
                                    <div className="flex-1 h-[1px]" style={{ backgroundColor: 'var(--border)' }} />
                                </div>
                            )}
                            {lockedLetters.map((letter) => (
                                <motion.div
                                    key={letter.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={isAdmin ? { y: -3 } : {}}
                                    onClick={() => isAdmin && handleOpenLetter(letter)}
                                    className={`p-5 sm:p-6 rounded-2xl border transition-all relative overflow-hidden group ${isAdmin ? 'cursor-pointer' : ''}`}
                                    style={{
                                        backgroundColor: 'var(--input-bg)',
                                        borderColor: 'var(--border)',
                                        opacity: isAdmin ? 0.8 : 0.6,
                                    }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                                            <Lock className="w-4 h-4" style={{ color: 'var(--text-faint)' }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {/* Admin can see title, Ratih sees hidden */}
                                            <h3 className="text-base font-medium truncate" style={{ color: 'var(--text-muted)' }}>
                                                {isAdmin ? letter.title : "A surprise awaits..."}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Lock className="w-2.5 h-2.5" style={{ color: 'var(--text-faint)' }} />
                                                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                                                    {getCountdown(letter.unlock_date)}
                                                </span>
                                            </div>
                                            <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
                                                Opens {new Date(letter.unlock_date).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                        {isAdmin && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteLetter(letter.id); }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 p-1"
                                                style={{ color: 'var(--text-faint)' }}
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

            {/* Read Letter Modal */}
            <AnimatePresence>
                {selectedLetter && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedLetter(null)}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl"
                        style={{ backgroundColor: 'var(--modal-overlay)' }}
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0, rotate: -1 }}
                            animate={{ y: 0, opacity: 1, rotate: 0 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="bg-[#fcfaf2] p-6 sm:p-8 md:p-16 rounded-sm max-w-2xl w-full text-zinc-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative min-h-[400px] sm:min-h-[500px] overflow-y-auto max-h-[90vh] flex flex-col items-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-full flex justify-end mb-8">
                                <button
                                    onClick={() => setSelectedLetter(null)}
                                    className="text-zinc-400 hover:text-zinc-800 transition-colors uppercase tracking-[0.3em] text-[10px]"
                                >
                                    Close Letter
                                </button>
                            </div>

                            <div className="w-full max-w-prose">
                                <div className="mb-12 text-center">
                                    <div className="inline-block px-4 py-1 border-y border-zinc-200 mb-8">
                                        <span className="text-[10px] uppercase tracking-[0.5em] text-zinc-400">
                                            {selectedLetter.author ? `Letter from ${selectedLetter.author}` : "Private Letter"}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif italic mb-4 leading-tight">
                                        {selectedLetter.title}
                                    </h2>
                                    <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest">
                                        {new Date(selectedLetter.unlock_date).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>

                                <div className="prose prose-zinc leading-[2] font-serif text-xl text-zinc-700 whitespace-pre-wrap first-letter:text-5xl first-letter:float-left first-letter:mr-3 first-letter:pt-2">
                                    {selectedLetter.content}
                                </div>

                                <div className="mt-20 pt-10 border-t border-zinc-100 text-center">
                                    <p className="font-serif italic text-zinc-400 text-lg">Always yours{selectedLetter.author ? `, ${selectedLetter.author}` : ""}.</p>
                                </div>
                            </div>

                            {/* Decorative Corner Texture */}
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-zinc-100/50 to-transparent pointer-events-none" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Write Letter Modal */}
            <AnimatePresence>
                {isWriting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md"
                        style={{ backgroundColor: 'var(--modal-overlay)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl max-w-lg w-full border"
                            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-serif italic font-light" style={{ color: 'var(--text-primary)' }}>New Future Letter</h3>
                                <button onClick={() => setIsWriting(false)}><X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /></button>
                            </div>
                            <form onSubmit={handleWriteLetter} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Letter Title (e.g., Buat Ratih yang Lagi Capek)"
                                    value={newLetter.title}
                                    onChange={(e) => setNewLetter({ ...newLetter, title: e.target.value })}
                                    className="w-full rounded-xl p-4 text-sm outline-none"
                                    style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest pl-1" style={{ color: 'var(--text-muted)' }}>Unlock Date</label>
                                    <input
                                        type="date"
                                        value={newLetter.unlockDate}
                                        onChange={(e) => setNewLetter({ ...newLetter, unlockDate: e.target.value })}
                                        className="w-full rounded-xl p-4 text-sm outline-none"
                                        style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <textarea
                                    placeholder="Write your message here..."
                                    value={newLetter.content}
                                    onChange={(e) => setNewLetter({ ...newLetter, content: e.target.value })}
                                    className="w-full h-48 rounded-xl p-4 text-sm outline-none resize-none"
                                    style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                                <button
                                    type="submit"
                                    className="w-full p-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                    style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                                >
                                    <Send className="w-4 h-4" />
                                    Seal Letter
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
