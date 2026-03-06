"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Meh, BatteryWarning, Frown, Heart, Sparkles, Volume2, Play, Pause } from "lucide-react";
import { Mood } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

interface MoodLetter {
    title: string;
    content: string;
}

const MOODS: { label: Mood; icon: React.ReactNode; color: string }[] = [
    { label: "Happy", icon: <Smile className="w-6 h-6" />, color: "glass" },
    { label: "Neutral", icon: <Meh className="w-6 h-6" />, color: "glass" },
    { label: "Tired", icon: <BatteryWarning className="w-6 h-6" />, color: "glass" },
    { label: "Sad", icon: <Frown className="w-6 h-6" />, color: "glass" },
];

export function MoodSupport() {
    const [currentMood, setCurrentMood] = useState<Mood | null>(null);
    const [showHug, setShowHug] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [moodLetter, setMoodLetter] = useState<MoodLetter | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const today = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    }).format(new Date());

    const handleMoodSelect = async (mood: Mood) => {
        setCurrentMood(mood);
        setMoodLetter(null);

        // Fetch responsive letter from Supabase
        const { data } = await supabase
            .from('mood_letters')
            .select('title, content')
            .eq('mood', mood)
            .maybeSingle();

        if (data) {
            setMoodLetter(data);
        } else {
            // Fallback content if no letter in DB
            const fallbacks: Record<Mood, MoodLetter> = {
                'Happy': { title: 'Yay!', content: 'I am so happy that you are happy today! Keep that beautiful smile on your face. ❤️' },
                'Neutral': { title: 'Thinking of You', content: 'Just a regular day, but remember you are special to me. Hope your day stays peaceful.' },
                'Tired': { title: 'Rest Up, Love', content: 'You have worked so hard. Please take a moment to breathe and rest. You deserve it.' },
                'Sad': { title: 'I am Right Here', content: 'I wish I could be there to give you a real hug. Remember that I love you no matter what. This too shall pass.' }
            };
            setMoodLetter(fallbacks[mood]);
        }

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
            <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full pointer-events-none" style={{ backgroundColor: 'var(--accent-soft)' }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10"
            >
                <p className="text-sm font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{today}</p>
                <h2 className="text-3xl font-light mt-2 font-serif" style={{ color: 'var(--accent)' }}>
                    Hi, Ratih.
                </h2>
                <p className="mt-1 font-serif italic" style={{ color: 'var(--text-secondary)' }}>How is your heart feeling today?</p>

                <div className="grid grid-cols-2 gap-4 mt-8">
                    {MOODS.map((moodItem) => {
                        const isSelected = currentMood === moodItem.label;
                        return (
                            <motion.button
                                key={moodItem.label}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleMoodSelect(moodItem.label)}
                                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all`}
                                style={{
                                    backgroundColor: isSelected ? 'var(--accent-soft)' : 'var(--input-bg)',
                                    borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                                    color: isSelected ? 'var(--accent)' : 'var(--text-muted)'
                                }}
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
                    {currentMood && moodLetter && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mt-8 space-y-6"
                        >
                            {/* Mood Responsive Letter */}
                            <div className="glass p-8 rounded-3xl relative overflow-hidden group">
                                <Sparkles className="absolute top-4 right-4 w-4 h-4 transition-colors" style={{ color: 'var(--accent)' }} />
                                <h3 className="text-xl font-serif italic mb-4" style={{ color: 'var(--text-primary)' }}>{moodLetter.title}</h3>
                                <p className="text-sm leading-relaxed font-serif" style={{ color: 'var(--text-secondary)' }}>
                                    {moodLetter.content}
                                </p>
                            </div>

                            {(currentMood === "Sad" || currentMood === "Tired") && (
                                <div className="glass rounded-3xl p-6 relative overflow-hidden">
                                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to right, var(--accent-soft), transparent)' }} />

                                    <div className="relative z-10 flex items-center gap-6">
                                        <button
                                            onClick={toggleAudio}
                                            className="w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shrink-0"
                                            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                                        >
                                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                                        </button>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Volume2 className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                                                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Audio Support</span>
                                            </div>
                                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>A message for your heart</p>
                                        </div>

                                        {/* Audio Element */}
                                        <audio ref={audioRef} src="/audio/support.mp3" loop />
                                    </div>

                                    {/* Visualizer bars */}
                                    <div className="flex items-end gap-1 px-4 mt-6 opacity-20 h-4">
                                        {[...Array(20)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ height: isPlaying ? ["20%", "100%", "40%"] : "20%" }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.05 }}
                                                className="flex-1 bg-white rounded-full"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
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
                        className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md rounded-3xl"
                        style={{ backgroundColor: 'var(--modal-overlay)' }}
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
                            <Heart className="w-24 h-24 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" style={{ color: 'var(--accent)' }} fill="currentColor" />
                            <p className="mt-4 font-light tracking-widest uppercase text-sm" style={{ color: 'var(--text-secondary)' }}>Sending a virtual hug...</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
