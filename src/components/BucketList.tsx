"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Trash2, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/admin-context";

interface BucketItem {
    id: string;
    title: string;
    is_completed: boolean;
    author?: string;
    created_at?: string;
}

export function BucketList() {
    const { authorName } = useAdmin();
    const [items, setItems] = useState<BucketItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchItems();

        const channel = supabase
            .channel("bucket_list_changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "bucket_list" }, () => {
                fetchItems();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchItems = async () => {
        const { data } = await supabase
            .from("bucket_list")
            .select("*")
            .order("created_at", { ascending: true });
        if (data) setItems(data);
        setLoading(false);
    };

    const toggleItem = async (item: BucketItem) => {
        await supabase
            .from("bucket_list")
            .update({ is_completed: !item.is_completed })
            .eq("id", item.id);
    };

    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        await supabase.from("bucket_list").insert({
            title: newItem.trim(),
            author: authorName,
        });

        setNewItem("");
        setIsAdding(false);
    };

    const deleteItem = async (id: string) => {
        await supabase.from("bucket_list").delete().eq("id", id);
    };

    return (
        <div className="w-full relative py-12">
            <div className="text-center mb-12">
                <h3 className="text-2xl font-light tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Our Bucket List
                </h3>
                <div className="w-12 h-[1px] mx-auto mb-4" style={{ backgroundColor: 'var(--border)' }} />
                <p className="font-serif italic text-sm" style={{ color: 'var(--text-muted)' }}>
                    Promises to keep. Places to go.
                </p>
            </div>

            <div className="max-w-2xl mx-auto flex flex-col gap-4">
                <AnimatePresence>
                    {items.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass rounded-2xl p-4 flex items-center gap-4 group cursor-pointer transition-colors"
                        >
                            {/* Custom Checkbox */}
                            <div
                                className="w-6 h-6 rounded-full border flex shrink-0 items-center justify-center transition-all duration-300"
                                style={{
                                    backgroundColor: item.is_completed ? 'var(--accent)' : 'transparent',
                                    borderColor: item.is_completed ? 'var(--accent)' : 'var(--text-faint)',
                                    color: item.is_completed ? '#fff' : 'transparent'
                                }}
                                onClick={() => toggleItem(item)}
                            >
                                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            </div>

                            {/* Item Title with Strikethrough Animation */}
                            <div className="relative flex-1 py-1" onClick={() => toggleItem(item)}>
                                <span
                                    className="text-lg font-light transition-colors duration-500"
                                    style={{ color: item.is_completed ? 'var(--text-faint)' : 'var(--text-primary)' }}
                                >
                                    {item.title}
                                </span>

                                {/* Animated Strikethrough Line */}
                                <motion.div
                                    initial={false}
                                    animate={{
                                        width: item.is_completed ? "100%" : "0%",
                                        opacity: item.is_completed ? 1 : 0
                                    }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] origin-left"
                                    style={{ backgroundColor: 'var(--text-faint)' }}
                                />
                            </div>

                            {/* Author tag */}
                            {item.author && (
                                <span className="text-[9px] font-serif italic opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-faint)' }}>
                                    {item.author}
                                </span>
                            )}

                            {/* Delete button — visible on mobile, hover on desktop */}
                            <button
                                onClick={() => deleteItem(item.id)}
                                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:text-red-400 p-1 touch-manipulation"
                                style={{ color: 'var(--text-faint)' }}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Add new item */}
                <AnimatePresence>
                    {isAdding ? (
                        <motion.form
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={addItem}
                            className="glass rounded-2xl p-4 flex items-center gap-3"
                        >
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="What should we do together?"
                                autoFocus
                                className="flex-1 bg-transparent outline-none text-lg font-light"
                                style={{ color: 'var(--text-primary)' }}
                            />
                            <button type="submit" className="p-2 rounded-full transition-colors" style={{ color: 'var(--accent)' }}>
                                <Send className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => { setIsAdding(false); setNewItem(""); }} className="p-2 rounded-full transition-colors" style={{ color: 'var(--text-faint)' }}>
                                <Plus className="w-4 h-4 rotate-45" />
                            </button>
                        </motion.form>
                    ) : (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setIsAdding(true)}
                            className="glass rounded-2xl p-4 flex items-center justify-center gap-2 transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-widest">Add Dream</span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Minimalist Note */}
            <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
                className="text-center text-xs mt-12 tracking-widest uppercase"
                style={{ color: 'var(--text-faint)' }}
            >
                {loading ? "Loading dreams..." : "To be continued..."}
            </motion.p>
        </div>
    );
}
