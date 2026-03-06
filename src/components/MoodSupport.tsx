"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Smile, Meh, BatteryWarning, Frown, Heart, Sparkles,
    Volume2, Play, Pause, Mic, Square, Trash2, Send, Loader2, X
} from "lucide-react";
import { Mood } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/admin-context";

interface MoodLetter {
    title: string;
    content: string;
}

interface VoiceNote {
    id: string;
    title: string;
    audio_url: string;
    date: string;
    author?: string;
    created_at: string;
}

const MOODS: { label: Mood; icon: React.ReactNode }[] = [
    { label: "Happy", icon: <Smile className="w-6 h-6" /> },
    { label: "Neutral", icon: <Meh className="w-6 h-6" /> },
    { label: "Tired", icon: <BatteryWarning className="w-6 h-6" /> },
    { label: "Sad", icon: <Frown className="w-6 h-6" /> },
];

export function MoodSupport() {
    const { isAdmin } = useAdmin();
    const [currentMood, setCurrentMood] = useState<Mood | null>(null);
    const [showHug, setShowHug] = useState(false);
    const [moodLetter, setMoodLetter] = useState<MoodLetter | null>(null);

    // Voice notes state
    const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(true);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [noteTitle, setNoteTitle] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [recordError, setRecordError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const modalOpenedAt = useRef<number>(0);

    const today = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    }).format(new Date());

    // Fetch voice notes on mount
    useEffect(() => {
        fetchVoiceNotes();
    }, []);

    const fetchVoiceNotes = async () => {
        setLoadingNotes(true);
        const { data } = await supabase
            .from("voice_notes")
            .select("*")
            .order("created_at", { ascending: false });
        if (data) setVoiceNotes(data);
        setLoadingNotes(false);
    };

    // Mood selection
    const handleMoodSelect = async (mood: Mood) => {
        setCurrentMood(mood);
        setMoodLetter(null);

        const { data } = await supabase
            .from("mood_letters")
            .select("title, content")
            .eq("mood", mood)
            .maybeSingle();

        if (data) {
            setMoodLetter(data);
        } else {
            const fallbacks: Record<Mood, MoodLetter> = {
                Happy: { title: "Yay!", content: "I am so happy that you are happy today! Keep that beautiful smile on your face. ❤️" },
                Neutral: { title: "Thinking of You", content: "Just a regular day, but remember you are special to me. Hope your day stays peaceful." },
                Tired: { title: "Rest Up, Love", content: "You have worked so hard. Please take a moment to breathe and rest. You deserve it." },
                Sad: { title: "I am Right Here", content: "I wish I could be there to give you a real hug. Remember that I love you no matter what. This too shall pass." },
            };
            setMoodLetter(fallbacks[mood]);
        }

        if (mood === "Sad" || mood === "Tired") {
            setShowHug(true);
            setTimeout(() => setShowHug(false), 3000);
        }
    };

    // ===== AUDIO PLAYBACK =====
    const playNote = (note: VoiceNote) => {
        if (playingId === note.id) {
            audioPlayerRef.current?.pause();
            setPlayingId(null);
            return;
        }

        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
        }

        const audio = new Audio(note.audio_url);
        audioPlayerRef.current = audio;
        audio.play().catch((err) => console.error("Playback failed:", err));
        audio.onended = () => setPlayingId(null);
        setPlayingId(note.id);
    };

    // ===== RECORDING =====
    const getSupportedMimeType = (): string | undefined => {
        if (typeof MediaRecorder === "undefined") return undefined;
        const types = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/mp4",
            "audio/aac",
            "audio/ogg;codecs=opus",
            "audio/ogg",
            "",
        ];
        for (const t of types) {
            try {
                if (t === "" || MediaRecorder.isTypeSupported(t)) return t || undefined;
            } catch (_e) { /* skip */ }
        }
        return undefined;
    };

    const startRecording = async () => {
        setRecordError(null);

        // Check browser support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setRecordError("Browser tidak mendukung recording. Gunakan Chrome/Safari terbaru dan pastikan akses lewat HTTPS atau localhost.");
            return;
        }
        if (typeof MediaRecorder === "undefined") {
            setRecordError("MediaRecorder tidak tersedia di browser ini.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mimeType = getSupportedMimeType();
            const options: MediaRecorderOptions = mimeType ? { mimeType } : {};

            let mediaRecorder: MediaRecorder;
            try {
                mediaRecorder = new MediaRecorder(stream, options);
            } catch (_e) {
                // Fallback: no options at all
                mediaRecorder = new MediaRecorder(stream);
            }

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onerror = () => {
                setRecordError("Terjadi error saat merekam. Coba lagi.");
                setIsRecording(false);
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.onstop = () => {
                if (chunksRef.current.length === 0) {
                    setRecordError("Rekaman kosong. Pastikan mikrofon berfungsi.");
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }
                const actualType = mediaRecorder.mimeType || mimeType || "audio/webm";
                const blob = new Blob(chunksRef.current, { type: actualType });
                if (blob.size === 0) {
                    setRecordError("Rekaman kosong. Pastikan mikrofon berfungsi.");
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }
                setRecordedBlob(blob);
                setRecordedUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("Permission") || msg.includes("NotAllowed")) {
                setRecordError("Izin mikrofon ditolak. Buka Settings > Privacy > Microphone dan izinkan browser.");
            } else if (msg.includes("NotFound") || msg.includes("Requested device not found")) {
                setRecordError("Mikrofon tidak ditemukan. Pastikan ada mikrofon yang terhubung.");
            } else {
                setRecordError("Gagal akses mikrofon: " + msg);
            }
            console.error("Mic error:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            try { mediaRecorderRef.current.requestData(); } catch (_e) { /* ok */ }
            mediaRecorderRef.current.stop();
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsRecording(false);
    };

    const cancelRecording = () => {
        stopRecording();
        // Also stop stream tracks if still active
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setRecordedBlob(null);
        setRecordedUrl(null);
        setNoteTitle("");
        setRecordError(null);
        setShowRecordModal(false);
    };

    const saveRecording = async () => {
        if (!recordedBlob || isUploading) return;

        setIsUploading(true);
        try {
            // Determine file extension and content type from blob
            const blobType = recordedBlob.type || "audio/webm";
            let ext = "webm";
            if (blobType.includes("mp4") || blobType.includes("m4a")) ext = "mp4";
            else if (blobType.includes("ogg")) ext = "ogg";

            const fileName = `voice_${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from("voice-notes")
                .upload(fileName, recordedBlob, { contentType: blobType });

            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage.from("voice-notes").getPublicUrl(fileName);

            const dateStr = new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            });

            const { data, error } = await supabase
                .from("voice_notes")
                .insert([
                    {
                        title: noteTitle || "Voice Message",
                        audio_url: publicUrl,
                        date: dateStr,
                        author: "Ezi",
                    },
                ])
                .select();

            if (error) throw error;

            if (data) {
                setVoiceNotes((prev) => [data[0], ...prev]);
            }

            setRecordedBlob(null);
            setRecordedUrl(null);
            setNoteTitle("");
            setShowRecordModal(false);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : JSON.stringify(err);
            console.error("Save error:", err);
            setRecordError("Gagal menyimpan: " + msg);
        } finally {
            setIsUploading(false);
        }
    };

    const deleteNote = async (note: VoiceNote) => {
        if (!confirm("Hapus voice note ini?")) return;

        try {
            if (note.audio_url.includes("voice-notes/")) {
                const path = note.audio_url.split("/voice-notes/").pop();
                if (path) {
                    await supabase.storage.from("voice-notes").remove([decodeURIComponent(path)]);
                }
            }

            const { error } = await supabase.from("voice_notes").delete().eq("id", note.id);
            if (error) throw error;

            setVoiceNotes((prev) => prev.filter((n) => n.id !== note.id));
            if (playingId === note.id) {
                audioPlayerRef.current?.pause();
                setPlayingId(null);
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("Gagal hapus voice note.");
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <>
        <div className="glass rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full pointer-events-none" style={{ backgroundColor: "var(--accent-soft)" }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10"
            >
                <p className="text-sm font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{today}</p>
                <h2 className="text-2xl sm:text-3xl font-light mt-2 font-serif" style={{ color: "var(--accent)" }}>
                    Hi, Ratih.
                </h2>
                <p className="mt-1 font-serif italic" style={{ color: "var(--text-secondary)" }}>How is your heart feeling today?</p>

                {/* Mood Buttons */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                    {MOODS.map((moodItem) => {
                        const isSelected = currentMood === moodItem.label;
                        return (
                            <motion.button
                                key={moodItem.label}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleMoodSelect(moodItem.label)}
                                className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all"
                                style={{
                                    backgroundColor: isSelected ? "var(--accent-soft)" : "var(--input-bg)",
                                    borderColor: isSelected ? "var(--accent)" : "var(--border)",
                                    color: isSelected ? "var(--accent)" : "var(--text-muted)",
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

                {/* Mood Letter */}
                <AnimatePresence>
                    {currentMood && moodLetter && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mt-8 space-y-6"
                        >
                            <div className="glass p-6 sm:p-8 rounded-2xl sm:rounded-3xl relative overflow-hidden group">
                                <Sparkles className="absolute top-4 right-4 w-4 h-4 transition-colors" style={{ color: "var(--accent)" }} />
                                <h3 className="text-xl font-serif italic mb-4" style={{ color: "var(--text-primary)" }}>{moodLetter.title}</h3>
                                <p className="text-sm leading-relaxed font-serif" style={{ color: "var(--text-secondary)" }}>
                                    {moodLetter.content}
                                </p>
                            </div>

                            {/* Voice note player for Ratih — only on Sad/Tired */}
                            {!isAdmin && (currentMood === "Sad" || currentMood === "Tired") && voiceNotes.length > 0 && (
                                <div className="glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 relative overflow-hidden">
                                    <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right, var(--accent-soft), transparent)" }} />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Volume2 className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                                            <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>A voice from Ezi</span>
                                        </div>
                                        <div className="space-y-2">
                                            {voiceNotes.map((note) => {
                                                const isNotePlaying = playingId === note.id;
                                                return (
                                                    <div key={note.id} className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => playNote(note)}
                                                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 hover:scale-110 active:scale-95 transition-transform"
                                                            style={{
                                                                backgroundColor: isNotePlaying ? "var(--accent)" : "var(--input-bg)",
                                                                color: isNotePlaying ? "#fff" : "var(--text-muted)",
                                                            }}
                                                        >
                                                            {isNotePlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                                        </button>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{note.title}</p>
                                                            <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{note.date}</span>
                                                        </div>
                                                        {isNotePlaying && (
                                                            <div className="flex items-end gap-[2px] h-4">
                                                                {[...Array(4)].map((_, i) => (
                                                                    <motion.div
                                                                        key={i}
                                                                        animate={{ height: ["30%", "100%", "50%"] }}
                                                                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                                                        className="w-[3px] rounded-full"
                                                                        style={{ backgroundColor: "var(--accent)" }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ===== VOICE MESSAGES SECTION — Admin only ===== */}
                {isAdmin && (<div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Mic className="w-4 h-4" style={{ color: "var(--accent)" }} />
                            <h4 className="text-xs uppercase tracking-[0.2em] font-medium" style={{ color: "var(--text-muted)" }}>
                                Voice Messages
                            </h4>
                        </div>

                        {/* Record button — Admin only */}
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    modalOpenedAt.current = Date.now();
                                    setShowRecordModal(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                            >
                                <Mic className="w-3 h-3" />
                                Record
                            </button>
                        )}
                    </div>

                    {/* Voice Notes List */}
                    {loadingNotes ? (
                        <div className="text-center py-6">
                            <Loader2 className="w-4 h-4 animate-spin mx-auto" style={{ color: "var(--text-muted)" }} />
                        </div>
                    ) : voiceNotes.length === 0 ? (
                        <div className="text-center py-6 rounded-2xl" style={{ border: "1px dashed var(--border)" }}>
                            <Volume2 className="w-5 h-5 mx-auto mb-2" style={{ color: "var(--text-faint)" }} />
                            <p className="text-xs font-serif italic" style={{ color: "var(--text-faint)" }}>
                                {isAdmin ? "Belum ada voice message. Rekam yang pertama!" : "No voice messages yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {voiceNotes.map((note) => {
                                const isNotePlaying = playingId === note.id;
                                return (
                                    <motion.div
                                        key={note.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 group"
                                    >
                                        {/* Play/Pause Button */}
                                        <button
                                            onClick={() => playNote(note)}
                                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 hover:scale-110 active:scale-95 transition-transform"
                                            style={{
                                                backgroundColor: isNotePlaying ? "var(--accent)" : "var(--input-bg)",
                                                color: isNotePlaying ? "#fff" : "var(--text-muted)",
                                            }}
                                        >
                                            {isNotePlaying ? (
                                                <Pause className="w-4 h-4" />
                                            ) : (
                                                <Play className="w-4 h-4 ml-0.5" />
                                            )}
                                        </button>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{note.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{note.date}</span>
                                                {note.author && (
                                                    <span className="text-[10px] font-serif italic" style={{ color: "var(--text-faint)" }}>— {note.author}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Animated bars when playing */}
                                        {isNotePlaying && (
                                            <div className="flex items-end gap-[2px] h-4 mr-1">
                                                {[...Array(4)].map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{ height: ["30%", "100%", "50%"] }}
                                                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                                        className="w-[3px] rounded-full"
                                                        style={{ backgroundColor: "var(--accent)" }}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Delete — Admin only */}
                                        {isAdmin && (
                                            <button
                                                onClick={() => deleteNote(note)}
                                                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:text-red-400 p-1.5 touch-manipulation"
                                                style={{ color: "var(--text-faint)" }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>)}
            </motion.div>

            {/* Virtual Hug Animation Overlay */}
            <AnimatePresence>
                {showHug && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
                        className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md rounded-3xl"
                        style={{ backgroundColor: "var(--modal-overlay)" }}
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
                            <Heart className="w-24 h-24 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" style={{ color: "var(--accent)" }} fill="currentColor" />
                            <p className="mt-4 font-light tracking-widest uppercase text-sm" style={{ color: "var(--text-secondary)" }}>Sending a virtual hug...</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

            {/* ===== RECORD MODAL — Rendered outside glass container to avoid overflow clip ===== */}
            <AnimatePresence>
                {showRecordModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => {
                            // Prevent immediate close from mobile touch passthrough
                            if (Date.now() - modalOpenedAt.current < 400) return;
                            if (e.target === e.currentTarget) cancelRecording();
                        }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 backdrop-blur-2xl"
                        style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] max-w-sm w-full text-center relative border"
                            style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
                        >
                            <button
                                onClick={cancelRecording}
                                className="absolute top-4 right-4 sm:top-6 sm:right-6 transition-colors"
                                style={{ color: "var(--text-muted)" }}
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <Mic className="w-8 h-8 mx-auto mb-4" style={{ color: "var(--accent)" }} />
                            <h3 className="text-xl font-serif italic font-light mb-1" style={{ color: "var(--text-primary)" }}>
                                Voice Message
                            </h3>
                            <p className="text-[10px] uppercase tracking-[0.3em] mb-8" style={{ color: "var(--text-muted)" }}>
                                Record a message for Ratih
                            </p>

                            {/* Error display */}
                            {recordError && (
                                <div className="mb-6 p-4 rounded-xl text-left text-xs leading-relaxed" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                                    {recordError}
                                    <button
                                        onClick={() => setRecordError(null)}
                                        className="block mt-2 underline text-[10px] uppercase tracking-widest opacity-70"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}

                            {/* State: Not yet recorded */}
                            {!recordedBlob && !isRecording && (
                                <div>
                                    <button
                                        onClick={startRecording}
                                        className="w-20 h-20 rounded-full mx-auto flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
                                        style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                                    >
                                        <Mic className="w-8 h-8" />
                                    </button>
                                    <p className="text-[10px] mt-6 uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
                                        Tap to start recording
                                    </p>
                                </div>
                            )}

                            {/* State: Recording */}
                            {isRecording && (
                                <div className="space-y-6">
                                    <div className="relative w-20 h-20 mx-auto">
                                        <motion.div
                                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className="absolute inset-0 rounded-full"
                                            style={{ backgroundColor: "var(--accent)" }}
                                        />
                                        <button
                                            onClick={stopRecording}
                                            className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all z-10"
                                            style={{ backgroundColor: "#ef4444", color: "#fff" }}
                                        >
                                            <Square className="w-6 h-6" fill="currentColor" />
                                        </button>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-light font-mono tracking-widest" style={{ color: "var(--text-primary)" }}>
                                            {formatTime(recordingTime)}
                                        </p>
                                        <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>
                                            Recording...
                                        </p>
                                    </div>
                                    <div className="flex items-end justify-center gap-1 h-6">
                                        {[...Array(12)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ height: ["20%", "100%", "40%"] }}
                                                transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.06 }}
                                                className="w-1 rounded-full"
                                                style={{ backgroundColor: "var(--accent)" }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* State: Recorded — Preview & Save */}
                            {recordedBlob && !isRecording && (
                                <div className="space-y-5">
                                    <div className="glass rounded-xl p-4">
                                        <audio src={recordedUrl || ""} controls className="w-full h-8" />
                                        <p className="text-[10px] mt-2 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                                            {formatTime(recordingTime)} recorded
                                        </p>
                                    </div>

                                    <input
                                        type="text"
                                        value={noteTitle}
                                        onChange={(e) => setNoteTitle(e.target.value)}
                                        placeholder="Judul pesan (opsional)"
                                        className="w-full rounded-xl p-4 text-sm outline-none text-center font-serif italic"
                                        style={{
                                            backgroundColor: "var(--input-bg)",
                                            border: "1px solid var(--border)",
                                            color: "var(--text-primary)",
                                        }}
                                    />

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setRecordedBlob(null);
                                                setRecordedUrl(null);
                                                setRecordingTime(0);
                                            }}
                                            className="flex-1 p-4 rounded-xl text-sm font-medium transition-all"
                                            style={{
                                                backgroundColor: "var(--input-bg)",
                                                color: "var(--text-muted)",
                                                border: "1px solid var(--border)",
                                            }}
                                        >
                                            Re-record
                                        </button>
                                        <button
                                            onClick={saveRecording}
                                            disabled={isUploading}
                                            className="flex-1 p-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                                        >
                                            {isUploading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                            {isUploading ? "Saving..." : "Save"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
