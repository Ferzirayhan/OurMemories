"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { MoodSupport } from "@/components/MoodSupport";
import { TimeCapsule } from "@/components/TimeCapsule";
import { Mixtape } from "@/components/Mixtape";
import { BucketList } from "@/components/BucketList";
import { Notebook } from "@/components/Notebook";

export default function Home() {
  return (
    <div className="min-h-screen tracking-wide font-sans relative overflow-hidden" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Background ambient light */}
      <div className="fixed top-[10%] left-[20%] w-[60%] h-[60%] rounded-full blur-[150px] pointer-events-none z-0" style={{ backgroundColor: 'var(--accent-soft)' }} />

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}
        className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24"
      >
        <TimeCapsule
          startDate="2026-02-04T00:00:00"
          subtext="Every second since we met again."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 my-24">
          {/* Left Column (Mood & Playlist) */}
          <section className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 self-start">
            <MoodSupport />
            <div className="mt-8">
              <Mixtape />
            </div>
          </section>

          {/* Right Column (Notebook & Bucket List) */}
          <section className="lg:col-span-7 flex flex-col gap-12">
            <Notebook />
            <div className="mt-8 pt-12" style={{ borderTop: '1px solid var(--border)' }}>
              <BucketList />
            </div>
          </section>
        </div>

        {/* Secret Space Portal */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 pt-32 text-center"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="glass p-12 md:p-20 rounded-[3rem] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ background: 'linear-gradient(to bottom, var(--accent-soft), transparent)' }} />
            <Sparkles className="w-8 h-8 mx-auto mb-8 opacity-50 group-hover:scale-110 transition-transform duration-500" style={{ color: 'var(--text-muted)' }} />
            <h2 className="text-4xl md:text-5xl font-serif italic mb-6 font-light" style={{ color: 'var(--text-primary)' }}>The Secret Space</h2>
            <p className="max-w-lg mx-auto mb-10 leading-relaxed font-serif uppercase tracking-widest text-[10px]" style={{ color: 'var(--text-muted)' }}>
              A private corner filled with small surprises, future promises, and the growth of our story.
            </p>
            <Link
              href="/secret-space"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-sm font-medium hover:scale-105 active:scale-95 transition-all"
              style={{ backgroundColor: 'var(--accent)', color: '#fff', boxShadow: '0 10px 30px var(--shadow-color)' }}
            >
              Enter Our Hidden World
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
