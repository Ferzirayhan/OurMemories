"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, FileText, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/admin-context";

interface Note {
    id: string;
    text: string;
    date: string;
    author?: string;
}

export function Notebook() {
    const { isAdmin, authorName } = useAdmin();
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
                        date: dateStr,
                        author: authorName
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
                <FileText className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                <h3 className="text-xl font-light tracking-[0.2em] uppercase" style={{ color: 'var(--text-secondary)' }}>
                    Daily Notebook
                </h3>
            </div>

            <p className="font-serif italic text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Tell me about your day. What made you smile? Or what's on your mind?
            </p>

            {/* Editor Area */}
            <div className="relative glass rounded-xl sm:rounded-2xl overflow-hidden mb-6 sm:mb-8 group transition-colors">
                <textarea
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="Dear diary..."
                    disabled={isSaving}
                    className="w-full min-h-[120px] sm:min-h-[150px] bg-transparent resize-none outline-none p-4 sm:p-6 font-serif leading-relaxed disabled:opacity-50"
                    style={{ color: 'var(--text-primary)' }}
                />
                <div className="absolute bottom-4 right-4">
                    <button
                        onClick={handleSave}
                        disabled={!currentInput.trim() || isSaving}
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
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
                                className="pl-6 relative group/note"
                                style={{ borderLeft: '2px solid var(--border)' }}
                            >
                                <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--accent)', border: '2px solid var(--background)' }} />
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--text-muted)' }}>
                                            {note.date}
                                        </p>
                                        {note.author && <p className="text-[10px] font-serif italic" style={{ color: 'var(--text-faint)' }}>— {note.author}</p>}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(note.id)}
                                        className="opacity-100 lg:opacity-0 lg:group-hover/note:opacity-100 transition-opacity hover:text-red-400 p-2 -m-2 touch-manipulation"
                                        style={{ color: 'var(--text-faint)' }}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <p className="font-serif leading-relaxed italic text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                                    "{note.text}"
                                </p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {!isLoading && notes.length === 0 && (
                    <div className="text-center py-12 rounded-2xl" style={{ border: '1px dashed var(--border)' }}>
                        <p className="font-light text-sm" style={{ color: 'var(--text-faint)' }}>No notes for today yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
