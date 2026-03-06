"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, RefreshCw, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Memory } from "@/lib/mock-data";
import Link from "next/link";

// Simple hash function to get a consistent "random" index per day
function getDailySeed(): number {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        const char = dateStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash);
}

export function DailyMemory() {
    const [memory, setMemory] = useState<Memory | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        fetchDailyMemory();
    }, []);

    const fetchDailyMemory = async () => {
        setLoading(true);
        setImageLoaded(false);
        try {
            const { data, error } = await supabase
                .from('memories')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                const seed = getDailySeed();
                const index = seed % data.length;
                const m = data[index];
                setMemory({
                    id: m.id,
                    date: m.date,
                    title: m.title,
                    description: m.description,
                    curhatan: m.curhatan,
                    imageUrl: m.image_url,
                    author: m.author,
                });
            }
        } catch (error) {
            console.error("Error fetching daily memory:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="glass rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-4">
                    <Camera className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-medium" style={{ color: 'var(--text-muted)' }}>
                        Memory of the Day
                    </span>
                </div>
                <div className="animate-pulse space-y-4">
                    <div className="aspect-[4/3] rounded-2xl" style={{ backgroundColor: 'var(--glass-bg)' }} />
                    <div className="h-4 w-2/3 rounded" style={{ backgroundColor: 'var(--glass-bg)' }} />
                    <div className="h-3 w-1/2 rounded" style={{ backgroundColor: 'var(--glass-bg)' }} />
                </div>
            </div>
        );
    }

    if (!memory) {
        return (
            <div className="glass rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 text-center relative overflow-hidden">
                <Camera className="w-8 h-8 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-serif italic" style={{ color: 'var(--text-muted)' }}>
                    No memories yet. Start adding some in the{" "}
                    <Link href="/memories" className="underline" style={{ color: 'var(--accent)' }}>Gallery</Link>!
                </p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="glass rounded-[2rem] sm:rounded-[3rem] relative overflow-hidden group"
        >
            {/* Gradient overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, var(--accent-soft), transparent 60%)' }} />

            <div className="p-5 sm:p-8 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-soft)' }}>
                            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: 'var(--accent)' }} />
                        </div>
                        <div>
                            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] font-medium block" style={{ color: 'var(--text-muted)' }}>
                                Memory of the Day
                            </span>
                            <span className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                    </div>
                    <Link
                        href="/memories"
                        className="text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full glass transition-colors hover:opacity-80"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        See All
                    </Link>
                </div>

                {/* Photo Frame — Polaroid Style */}
                <div className="bg-white p-2 sm:p-3 rounded-xl shadow-xl mb-4 sm:mb-6 rotate-[-1deg] group-hover:rotate-0 transition-transform duration-500">
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-zinc-100">
                        <img
                            src={memory.imageUrl}
                            alt={memory.title}
                            onLoad={() => setImageLoaded(true)}
                            className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                        />
                        {!imageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <RefreshCw className="w-5 h-5 animate-spin text-zinc-300" />
                            </div>
                        )}
                    </div>
                    {/* Polaroid caption area */}
                    <div className="pt-2 sm:pt-3 pb-1 px-1 text-center">
                        <p className="text-xs sm:text-sm font-serif italic text-zinc-500 truncate">
                            {memory.title}
                        </p>
                    </div>
                </div>

                {/* Memory Info */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                            {memory.date}
                        </span>
                        {memory.author && (
                            <>
                                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>·</span>
                                <span className="text-[10px] font-serif italic" style={{ color: 'var(--text-faint)' }}>
                                    by {memory.author}
                                </span>
                            </>
                        )}
                    </div>
                    <p className="text-sm font-light leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                        {memory.description}
                    </p>
                    {memory.curhatan && (
                        <div className="flex items-start gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                            <Heart className="w-3 h-3 mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} fill="currentColor" />
                            <p className="text-xs font-serif italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                &ldquo;{memory.curhatan}&rdquo;
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
