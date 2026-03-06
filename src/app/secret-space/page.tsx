"use client";

import { motion } from "framer-motion";
import { LoveJar } from "@/components/LoveJar";
import { FutureLetters } from "@/components/FutureLetters";
import { GratitudeWall } from "@/components/GratitudeWall";
import { DearEzi } from "@/components/DearEzi";
import dynamic from "next/dynamic";

const OurMap = dynamic(() => import("@/components/OurMap"), { ssr: false });

import { Sparkles } from "lucide-react";

export default function SecretSpace() {
    return (
        <div className="min-h-screen tracking-wide font-sans relative overflow-hidden" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
            {/* Background elements */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, var(--accent-soft) 0%, transparent 50%)' }} />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12 pt-20 sm:pt-24"
            >
                {/* Header */}
                <header className="flex flex-col items-center text-center mb-12 sm:mb-24">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full glass mb-6">
                            <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-light font-serif italic py-2" style={{ color: 'var(--text-primary)' }}>
                            The Secret Space
                        </h1>
                        <p className="mt-4 max-w-md mx-auto italic font-serif" style={{ color: 'var(--text-muted)' }}>
                            A private sanctuary for the little things that mean the most.
                            Just for you, Ratih.
                        </p>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 xl:gap-20 mb-16 sm:mb-32">
                    {/* Top Row: Love Jar & Future Letters */}
                    <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch">
                        <section>
                            <LoveJar />
                        </section>
                        <section>
                            <FutureLetters />
                        </section>
                    </div>

                    {/* Dear Ezi — Safe space to share feelings */}
                    <div className="lg:col-span-12">
                        <DearEzi />
                    </div>

                    {/* Middle Row: Gratitude Wall */}
                    <div className="lg:col-span-12">
                        <GratitudeWall />
                    </div>

                    {/* Our Map */}
                    <div className="lg:col-span-12">
                        <OurMap />
                    </div>

                </div>


                <footer className="text-center py-20 opacity-30" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-[10px] uppercase tracking-[0.4em] font-medium" style={{ color: 'var(--text-muted)' }}>
                        Made with love & code
                    </p>
                </footer>
            </motion.div>
        </div>
    );
}
