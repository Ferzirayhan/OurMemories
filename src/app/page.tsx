"use client";

import { motion } from "framer-motion";
import { MoodSupport } from "@/components/MoodSupport";
import { TimeCapsule } from "@/components/TimeCapsule";
import { Mixtape } from "@/components/Mixtape";
import { BucketList } from "@/components/BucketList";
import { Notebook } from "@/components/Notebook";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground tracking-wide font-sans relative overflow-hidden">
      {/* Background ambient light */}
      <div className="fixed top-[10%] left-[20%] w-[60%] h-[60%] rounded-full bg-white/[0.02] blur-[150px] pointer-events-none z-0" />

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
            <div className="mt-8 border-t border-white/5 pt-12">
              <BucketList />
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
