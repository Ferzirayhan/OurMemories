"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Meh, BatteryWarning, Frown, Heart } from "lucide-react";
import { Mood } from "@/lib/mock-data";

const MOODS: { label: Mood; icon: React.ReactNode; color: string }[] = [
    { label: "Happy", icon: <Smile className="w-6 h-6" />, color: "text-zinc-100 bg-white/10 border-white/20" },
    { label: "Neutral", icon: <Meh className="w-6 h-6" />, color: "text-zinc-300 bg-white/5 border-white/10" },
    { label: "Tired", icon: <BatteryWarning className="w-6 h-6" />, color: "text-zinc-400 bg-white/5 border-white/10" },
    { label: "Sad", icon: <Frown className="w-6 h-6" />, color: "text-zinc-500 bg-white/5 border-white/10" },
];

export function MoodSupport() {
    const [currentMood, setCurrentMood] = useState<Mood | null>(null);
    const [showHug, setShowHug] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const today = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    }).format(new Date());

    const handleMoodSelect = (mood: Mood) => {
        setCurrentMood(mood);
        // Mock save to DB here
        if (mood === "Sad" || mood === "Tired") {
            setShowHug(true);
            setTimeout(() => setShowHug(false), 3000);
        } else {
            if (isPlaying && audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    const toggleAudio = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="glass rounded-3xl p-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10"
            >
                <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest">{today}</p>
                <h2 className="text-3xl font-light mt-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                    Hi, Ratih.
                </h2>
                <p className="text-zinc-400 mt-1">How is your heart feeling today?</p>

                <div className="grid grid-cols-2 gap-4 mt-8">
                    {MOODS.map((moodItem) => {
                        const isSelected = currentMood === moodItem.label;
                        return (
                            <motion.button
                                key={moodItem.label}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleMoodSelect(moodItem.label)}
                                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${isSelected
                                    ? moodItem.color + " border-opacity-50 ring-1 ring-white/20 shadow-lg shadow-white/5"
                                    : "bg-white/[0.02] border-white/5 hover:bg-white/10 text-zinc-500"
                                    }`}
                            >
                                <div className={isSelected ? "animate-bounce" : ""}>
                                    {moodItem.icon}
                                </div>
                                <span className="text-sm font-medium">{moodItem.label}</span>
                            </motion.button>
                        );
                    })}
                </div>

                <AnimatePresence>
                    {(currentMood === "Sad" || currentMood === "Tired") && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-8 pt-8 border-t border-white/10"
                        >
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                                {/* Decorative visualizer simulation */}
                                <div className="absolute bottom-0 left-0 right-0 h-1/2 flex items-end gap-1 px-4 opacity-10 pointer-events-none pb-2">
                                    {[...Array(20)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: isPlaying ? ["20%", "80%", "40%", "100%", "30%"] : "10%" }}
                                            transition={{ duration: 1.5, repeat: Infinity, repeatType: "mirror", delay: i * 0.1 }}
                                            className="flex-1 bg-white rounded-t-sm"
                                        />
                                    ))}
                                </div>

                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <p className="text-sm text-zinc-400 italic mb-4">
                                        "I am here for you. Listen to this when you need me."
                                    </p>

                                    {/* Audio Element (Placeholder) */}
                                    <audio ref={audioRef} src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" loop />

                                    <button
                                        onClick={toggleAudio}
                                        className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                                    >
                                        {isPlaying ? (
                                            <div className="w-4 h-4 bg-black rounded-sm" /> /* Stop Icon */
                                        ) : (
                                            <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-black ml-1" /> /* Play Icon */
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Virtual Hug Animation Overlay */}
            <AnimatePresence>
                {showHug && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-3xl"
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [-10, 10, -10],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            className="flex flex-col items-center"
                        >
                            {/* Updated Heart icon to be white/gray */}
                            <Heart className="w-24 h-24 text-zinc-300 fill-zinc-300/50 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                            <p className="mt-4 text-zinc-300 font-light tracking-widest uppercase text-sm">Sending a virtual hug...</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
