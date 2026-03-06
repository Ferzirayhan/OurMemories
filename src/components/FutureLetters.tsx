"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, MailOpen, Clock, Plus, X, Send, Trash2 } from "lucide-react";
import { FutureLetter } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/admin-context";

export function FutureLetters() {
    const { isAdmin, authorName } = useAdmin();
    const [letters, setLetters] = useState<FutureLetter[]>([]);
    const [selectedLetter, setSelectedLetter] = useState<FutureLetter | null>(null);
    const [isWriting, setIsWriting] = useState(false);
    const [newLetter, setNewLetter] = useState({ title: "", content: "", unlockDate: "" });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLetters();
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
        return new Date(dateStr) > new Date();
    };

    const getCountdown = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        if (diff <= 0) return "Unlocked";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return `${days}d ${hours}h left`;
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
            setLetters([...letters, data[0]].sort((a, b) => new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime()));
            setNewLetter({ title: "", content: "", unlockDate: "" });
            setIsWriting(false);
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--accent)' }} />
                    <h2 className="text-xl sm:text-2xl font-light font-serif italic" style={{ color: 'var(--text-secondary)' }}>Future Letters</h2>
                </div>
                <button
                    onClick={() => setIsWriting(true)}
                    className="glass px-4 py-2 rounded-full text-xs flex items-center gap-2 transition-all"
                    style={{ color: 'var(--text-muted)' }}
                >
                    <Plus className="w-3 h-3" />
                    Write Letter
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {letters.map((letter) => {
                    const locked = isLocked(letter.unlockDate);
                    return (
                        <motion.div
                            key={letter.id}
                            whileHover={locked ? {} : { y: -5 }}
                            onClick={() => !locked && setSelectedLetter(letter)}
                            className={`p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden`}
                            style={{
                                backgroundColor: locked ? 'var(--input-bg)' : 'var(--glass-bg)',
                                borderColor: locked ? 'var(--border)' : 'var(--border-hover)',
                                opacity: locked ? 0.5 : 1,
                                filter: locked ? 'grayscale(1)' : 'none'
                            }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                {locked ? <Lock className="w-5 h-5" style={{ color: 'var(--text-faint)' }} /> : <MailOpen className="w-5 h-5" style={{ color: 'var(--accent)' }} />}
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                        {getCountdown(letter.unlockDate)}
                                    </span>
                                    {isAdmin && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteLetter(letter.id); }}
                                            className="hover:text-red-400 transition-colors"
                                            style={{ color: 'var(--text-faint)' }}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <h3 className="text-lg font-medium mb-1 truncate" style={{ color: 'var(--text-primary)' }}>{letter.title}</h3>
                            {letter.author && <p className="text-[10px] font-serif italic mb-2" style={{ color: 'var(--text-faint)' }}>— {letter.author}</p>}
                            <p className="text-sm font-serif italic" style={{ color: 'var(--text-muted)' }}>
                                {locked ? "Unlock: " + new Date(letter.unlockDate).toLocaleDateString() : "Tap to read..."}
                            </p>
                        </motion.div>
                    );
                })}
            </div>

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
                                        {new Date(selectedLetter.unlockDate).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
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
                            className="glass p-6 sm:p-8 rounded-2xl sm:rounded-3xl max-w-lg w-full"
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
