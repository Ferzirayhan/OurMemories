"use client";

import { motion } from "framer-motion";
import { Play, Pause, Disc3, SkipForward, SkipBack } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { MOCK_PLAYLIST } from "@/lib/mock-data";

export function Mixtape() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const currentSong = MOCK_PLAYLIST[currentSongIndex];

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(err => console.error("Playback failed:", err));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentSongIndex]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    const nextSong = () => {
        setCurrentSongIndex((prev) => (prev + 1) % MOCK_PLAYLIST.length);
    };
    const prevSong = () => {
        setCurrentSongIndex((prev) => (prev - 1 + MOCK_PLAYLIST.length) % MOCK_PLAYLIST.length);
    };

    return (
        <div className="w-full glass rounded-3xl p-6 relative overflow-hidden group">
            {/* Audio Element */}
            {currentSong.audioUrl && (
                <audio
                    ref={audioRef}
                    src={currentSong.audioUrl}
                    onEnded={() => nextSong()}
                />
            )}
            <div className="text-center mb-6">
                <h3 className="text-xl font-light text-zinc-300 tracking-widest uppercase mb-1">Our Playlist</h3>
                <p className="text-zinc-500 font-serif italic text-xs">Songs that sound like you.</p>
            </div>

            <div className="flex flex-col xl:flex-row items-center gap-6 xl:gap-8 relative z-10">
                {/* Vinyl Player UI */}
                <div className="relative w-32 h-32 md:w-48 md:h-48 flex-shrink-0">
                    <motion.div
                        animate={{ rotate: isPlaying ? 360 : 0 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="w-full h-full rounded-full bg-zinc-900 border border-zinc-800 shadow-2xl flex items-center justify-center relative overflow-hidden"
                    >
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute rounded-full border border-zinc-800/50"
                                style={{ width: `${100 - i * 15}%`, height: `${100 - i * 15}%` }}
                            />
                        ))}
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-zinc-200 border-4 border-zinc-950 flex items-center justify-center relative z-10">
                            <div className="w-2 h-2 rounded-full bg-zinc-900" />
                        </div>
                    </motion.div>
                </div>

                {/* Song Details and Controls */}
                <div className="flex flex-col flex-1 w-full justify-center text-center xl:text-left">
                    <motion.div
                        key={currentSong.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-4"
                    >
                        <p className="text-[10px] text-zinc-500 tracking-widest uppercase mb-1">Now Playing</p>
                        <h4 className="text-xl md:text-2xl font-light text-zinc-100 mb-1 leading-tight">{currentSong.title}</h4>
                        <p className="text-sm text-zinc-400 font-medium">{currentSong.artist}</p>
                    </motion.div>

                    {/* Controls */}
                    <div className="flex items-center justify-center xl:justify-start gap-4 mb-4">
                        <button onClick={prevSong} className="text-zinc-500 hover:text-white transition-colors">
                            <SkipBack className="w-5 h-5" />
                        </button>
                        <button
                            onClick={togglePlay}
                            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10"
                        >
                            {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-1" />}
                        </button>
                        <button onClick={nextSong} className="text-zinc-500 hover:text-white transition-colors">
                            <SkipForward className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Personal Memory Text */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 md:p-4 relative">
                        <Disc3 className="hidden md:block absolute -top-3 -left-3 w-5 h-5 text-zinc-600 bg-background rounded-full" />
                        <motion.p
                            key={`desc-${currentSong.id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            className="text-xs md:text-sm font-serif italic text-zinc-300 leading-relaxed text-left"
                        >
                            {currentSong.memoryText}
                        </motion.p>
                    </div>
                </div>
            </div>

            {/* Decorative Background Blur */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] blur-3xl rounded-full pointer-events-none" />
        </div>
    );
}
