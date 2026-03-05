"use client";

import { useEffect, useState } from "react";
import { MemoryTimeline } from "@/components/MemoryTimeline";
import { MemoryUpload } from "@/components/MemoryUpload";
import { Memory } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

export default function MemoriesPage() {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMemories = async () => {
            const { data, error } = await supabase
                .from('memories')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching memories:", error);
            } else {
                setMemories(data.map((m: any) => ({
                    id: m.id,
                    date: m.date,
                    title: m.title,
                    description: m.description,
                    curhatan: m.curhatan,
                    imageUrl: m.image_url
                })));
            }
            setIsLoading(false);
        };

        fetchMemories();

        const channel = supabase
            .channel('memories-changes')
            .on(
                'postgres_changes' as any,
                { event: '*', table: 'memories' },
                (payload: any) => {
                    if (payload.eventType === 'INSERT') {
                        const newMemory: Memory = {
                            id: payload.new.id,
                            date: payload.new.date,
                            title: payload.new.title,
                            description: payload.new.description,
                            curhatan: payload.new.curhatan,
                            imageUrl: payload.new.image_url
                        };
                        setMemories(prev => {
                            if (prev.find(m => m.id === newMemory.id)) return prev;
                            return [newMemory, ...prev];
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setMemories(prev => prev.filter(m => m.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleUpload = (newMemory: Memory) => {
        setMemories(prev => {
            if (prev.find(m => m.id === newMemory.id)) return prev;
            return [newMemory, ...prev];
        });
    };

    const handleDelete = (id: string) => {
        setMemories(prev => prev.filter((m) => m.id !== id));
    };

    return (
        <div className="min-h-screen bg-background text-foreground tracking-wide font-sans relative overflow-hidden pt-32 pb-24">
            {/* Background ambient light */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-white/[0.03] blur-[100px] pointer-events-none z-0 rounded-b-full scale-y-50 origin-top" />

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-light tracking-[0.2em] uppercase text-zinc-200 mb-4">
                        Our Gallery
                    </h1>
                    <div className="w-16 h-[1px] bg-white/20 mx-auto mb-6" />
                    <p className="text-zinc-500 font-serif italic text-sm md:text-base max-w-md mx-auto">
                        Every frame is a story. Add yours to the timeline.
                    </p>
                </div>

                <MemoryUpload onUpload={handleUpload} />

                {isLoading ? (
                    <div className="text-center py-24 text-zinc-600 font-light">Loading memories...</div>
                ) : (
                    <MemoryTimeline initialMemories={memories} onDelete={handleDelete} />
                )}
            </div>
        </div>
    );
}
