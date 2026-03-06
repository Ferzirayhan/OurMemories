"use client";

import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { MOCK_PLAYLIST, Song } from "@/lib/mock-data";

interface AudioContextType {
    isPlaying: boolean;
    currentSongIndex: number;
    currentSong: Song;
    togglePlay: () => void;
    nextSong: () => void;
    prevSong: () => void;
    setSongIndex: (index: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const currentSong = MOCK_PLAYLIST[currentSongIndex];

    // Create a persistent audio element once (not tied to any component)
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }

        const audio = audioRef.current;

        const handleEnded = () => {
            setCurrentSongIndex((prev) => (prev + 1) % MOCK_PLAYLIST.length);
        };

        audio.addEventListener("ended", handleEnded);
        return () => {
            audio.removeEventListener("ended", handleEnded);
        };
    }, []);

    // Update source when song changes
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const song = MOCK_PLAYLIST[currentSongIndex];
        if (song.audioUrl) {
            audio.src = song.audioUrl;
            if (isPlaying) {
                audio.play().catch((err) => console.error("Playback failed:", err));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSongIndex]);

    // Play/pause
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.play().catch((err) => console.error("Playback failed:", err));
        } else {
            audio.pause();
        }
    }, [isPlaying]);

    const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);
    const nextSong = useCallback(() => {
        setCurrentSongIndex((prev) => (prev + 1) % MOCK_PLAYLIST.length);
    }, []);
    const prevSong = useCallback(() => {
        setCurrentSongIndex((prev) => (prev - 1 + MOCK_PLAYLIST.length) % MOCK_PLAYLIST.length);
    }, []);
    const setSongIndex = useCallback((index: number) => {
        setCurrentSongIndex(index);
    }, []);

    return (
        <AudioContext.Provider
            value={{ isPlaying, currentSongIndex, currentSong, togglePlay, nextSong, prevSong, setSongIndex }}
        >
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (!context) throw new Error("useAudio must be used within AudioProvider");
    return context;
}
