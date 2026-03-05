"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MOCK_MEMORIES, Memory } from "@/lib/mock-data";

import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

function MemoryCard({ memory, index, onDelete }: { memory: Memory; index: number; onDelete: (id: string) => void }) {
    const [isActive, setIsActive] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ["0 1", "1.2 1"],
    });

    const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
    const opacity = useTransform(scrollYProgress, [0, 1], [0.5, 1]);
    const x = useTransform(scrollYProgress, [0, 1], [index % 2 === 0 ? -50 : 50, 0]);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this memory?")) return;

        try {
            // 1. Delete image from Storage if it exists
            const urlParts = memory.imageUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];

            if (fileName && memory.imageUrl.includes('supabase.co')) {
                const { error: storageError } = await supabase.storage
                    .from('memories')
                    .remove([fileName]);

                if (storageError) console.error("Error deleting image from storage:", storageError);
            }

            // 2. Delete from Database
            const { error } = await supabase
                .from('memories')
                .delete()
                .eq('id', memory.id);

            if (error) throw error;
            onDelete(memory.id);
        } catch (error) {
            console.error("Error deleting memory:", error);
            alert("Failed to delete memory.");
        }
    };

    return (
        <motion.div
            ref={cardRef}
            style={{ scale, opacity, x }}
            className={`relative w-full md:w-[90%] flex ${index % 2 === 0 ? "justify-start" : "justify-end ml-auto"
                }`}
        >
            {/* Connector Line to Center (Desktop) */}
            <div
                className={`hidden md:block absolute top-[50%] w-[10%] h-[1px] bg-white/10 ${index % 2 === 0 ? "-right-[10%]" : "-left-[10%]"
                    }`}
            />
            {/* Soft Node on the Central Line (Desktop) */}
            <div
                className={`hidden md:block absolute top-[50%] -translate-y-1/2 w-3 h-3 border border-white/20 rounded-full bg-zinc-800 z-10 ${index % 2 === 0 ? "-right-[10%] translate-x-1/2" : "-left-[10%] -translate-x-1/2"
                    }`}
            />

            <div className="glass rounded-3xl p-6 w-full max-w-md group overflow-hidden relative cursor-default transition-colors border-white/5 hover:border-white/20 hover:bg-white/[0.08]">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">
                        {memory.date}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                        }}
                        className="relative z-[60] opacity-100 lg:opacity-40 lg:hover:opacity-100 transition-all duration-300 text-zinc-500 hover:text-red-400 p-2 -m-2 cursor-pointer hover:scale-110 active:scale-95 touch-manipulation"
                        title="Delete memory"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
                <h3 className="text-xl font-light text-zinc-200 mb-4">
                    {memory.title}
                </h3>

                <div
                    className="relative aspect-[4/5] sm:aspect-video rounded-xl overflow-hidden mb-4 bg-zinc-950 border border-white/5 shadow-lg cursor-pointer"
                    onClick={() => setIsActive(!isActive)}
                >
                    {/* Dark filter overlay on images for aesthetic */}
                    <div className={`absolute inset-0 bg-black/20 mix-blend-overlay z-0 pointer-events-none transition-opacity duration-700 ${isActive ? 'opacity-0' : 'group-hover:opacity-0'}`} />

                    <img
                        src={memory.imageUrl}
                        alt={memory.title}
                        className={`w-full h-full object-cover grayscale-[50%] contrast-125 transition-all duration-700 ${isActive ? 'scale-105 grayscale-0' : 'group-hover:scale-105 group-hover:grayscale-0'}`}
                    />
                    <div className={`absolute inset-0 bg-black/70 transition-opacity duration-300 flex items-center justify-center p-6 backdrop-blur-sm ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {/* Hidden "Handwritten Note" */}
                        <p className={`font-serif italic text-zinc-300 text-center transition-all duration-300 delay-100 font-light text-sm sm:text-base ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'}`}>
                            {memory.curhatan}
                        </p>
                    </div>
                </div>

                <p className="text-zinc-500 text-sm font-light leading-relaxed">
                    {memory.description}
                </p>
            </div>
        </motion.div>
    );
}

export function MemoryTimeline({ initialMemories = [], onDelete }: { initialMemories?: Memory[]; onDelete: (id: string) => void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    // Soft scroll indicator line
    const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    return (
        <div className="relative py-10" ref={containerRef}>
            <div className="relative w-full max-w-4xl mx-auto mt-10">
                {/* Central Vertical Line (hidden on small screens, shown on md+) */}
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/5 -translate-x-1/2">
                    <motion.div
                        style={{ height: lineHeight }}
                        className="w-full bg-gradient-to-b from-white/30 via-white/10 to-transparent origin-top"
                    />
                </div>

                <div className="flex flex-col gap-16 lg:gap-32 relative z-10 px-4 md:px-0 pb-32">
                    {initialMemories.map((memory, index) => (
                        <MemoryCard key={memory.id} memory={memory} index={index} onDelete={onDelete} />
                    ))}
                </div>
            </div>
        </div>
    );
}
