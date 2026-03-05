"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, FileText, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Note {
    id: string;
    text: string;
    date: string;
}

export function Notebook() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [currentInput, setCurrentInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchNotes = async () => {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching notes:", error);
            } else if (data) {
                setNotes(data);
            }
            setIsLoading(false);
        };

        fetchNotes();

        // Real-time updates for notes
        const channel = supabase
            .channel('notes-changes')
            .on(
                'postgres_changes' as any,
                { event: '*', table: 'notes' },
                (payload: any) => {
                    if (payload.eventType === 'INSERT') {
                        setNotes(prev => {
                            const newNote = payload.new as Note;
                            if (prev.find(n => n.id === newNote.id)) return prev;
                            return [newNote, ...prev];
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

    const handleSave = async () => {
        if (!currentInput.trim()) return;

        setIsSaving(true);
        const dateStr = new Date().toLocaleDateString("en-US", {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        try {
            const { data, error } = await supabase
                .from('notes')
                .insert([
                    {
                        text: currentInput,
                        date: dateStr
                    }
                ])
                .select();

            if (error) throw error;

            if (data && data[0]) {
                // Subscription will handle the state update, but we can do it manually for speed
                // if we want to avoid duplicates from subscription, we check
                setNotes(prev => {
                    if (prev.find(n => n.id === data[0].id)) return prev;
                    return [data[0], ...prev];
                });
            }
            setCurrentInput("");
        } catch (error) {
            console.error("Error saving note:", error);
            alert("Failed to save note.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this note?")) return;

        try {
            const { error } = await supabase
                .from('notes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setNotes(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error("Error deleting note:", error);
            alert("Failed to delete note.");
        }
    };

    return (
        <div className="w-full relative py-6">
            <div className="flex items-center gap-3 mb-6">
                <FileText className="w-5 h-5 text-zinc-400" />
                <h3 className="text-xl font-light text-zinc-300 tracking-[0.2em] uppercase">
                    Daily Notebook
                </h3>
            </div>

            <p className="text-zinc-500 font-serif italic text-sm mb-6">
                Tell me about your day. What made you smile? Or what's on your mind?
            </p>

            {/* Editor Area */}
            <div className="relative glass rounded-2xl border-white/5 overflow-hidden mb-8 group focus-within:border-white/20 transition-colors">
                <textarea
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="Dear diary..."
                    disabled={isSaving}
                    className="w-full min-h-[150px] bg-transparent resize-none outline-none p-6 text-zinc-200 placeholder:text-zinc-700 font-serif leading-relaxed disabled:opacity-50"
                />
                <div className="absolute bottom-4 right-4">
                    <button
                        onClick={handleSave}
                        disabled={!currentInput.trim() || isSaving}
                        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 ml-[-2px]" />
                        )}
                    </button>
                </div>
            </div>

            {/* Past Entries */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-600 mx-auto" />
                    </div>
                ) : (
                    <AnimatePresence>
                        {notes.map((note) => (
                            <motion.div
                                key={note.id}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="pl-6 border-l-2 border-white/10 relative group/note"
                            >
                                <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-zinc-800 border border-white/20" />
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
                                        {note.date}
                                    </p>
                                    <button
                                        onClick={() => handleDelete(note.id)}
                                        className="opacity-100 lg:opacity-0 lg:group-hover/note:opacity-100 transition-opacity text-zinc-600 hover:text-white p-2 -m-2 touch-manipulation"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <p className="text-zinc-300 font-serif leading-relaxed italic text-sm whitespace-pre-wrap">
                                    "{note.text}"
                                </p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {!isLoading && notes.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl">
                        <p className="text-zinc-600 font-light text-sm">No notes for today yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
