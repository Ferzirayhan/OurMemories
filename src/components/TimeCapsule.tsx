"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TimeLeft {
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

interface TimeCapsuleProps {
    startDate: string; // ISO String format e.g. "2023-01-01T00:00:00"
    subtext?: string;
}

export function TimeCapsule({ startDate, subtext = "Every second since we met." }: TimeCapsuleProps) {
    const calculateTimeLeft = (): TimeLeft => {
        const start = new Date(startDate).getTime();
        const now = new Date().getTime();
        let difference = now - start;

        if (difference < 0) difference = 0;

        // Approximate calculations for months and years
        const years = Math.floor(difference / (1000 * 60 * 60 * 24 * 365.25));
        difference -= years * (1000 * 60 * 60 * 24 * 365.25);

        const months = Math.floor(difference / (1000 * 60 * 60 * 24 * 30.44));
        difference -= months * (1000 * 60 * 60 * 24 * 30.44);

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        difference -= days * (1000 * 60 * 60 * 24);

        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        return { years, months, days, hours, minutes, seconds };
    };

    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [startDate]);

    // Format to 2 digits
    const formatNumber = (num: number) => num.toString().padStart(2, '0');

    if (!isMounted) return null; // Prevent hydration errors

    const timeUnits = [
        { label: "Years", value: timeLeft.years },
        { label: "Months", value: timeLeft.months },
        { label: "Days", value: timeLeft.days },
        { label: "Hours", value: formatNumber(timeLeft.hours) },
        { label: "Minutes", value: formatNumber(timeLeft.minutes) },
        { label: "Seconds", value: formatNumber(timeLeft.seconds) },
    ];

    return (
        <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 lg:py-24 relative overflow-hidden my-8 sm:my-16" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>

            {/* Minimalist Background Details */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-12" style={{ background: 'linear-gradient(to bottom, var(--accent), transparent)' }} />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-12" style={{ background: 'linear-gradient(to top, var(--accent), transparent)' }} />

            <div className="text-center mb-12 relative z-10">
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-sm tracking-[0.3em] uppercase mb-2 font-medium"
                    style={{ color: 'var(--text-muted)' }}
                >
                    Time Capsule
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-lg sm:text-xl lg:text-3xl font-light italic font-serif"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {subtext}
                </motion.p>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4 md:gap-8 max-w-4xl mx-auto px-2 sm:px-4 relative z-10"
            >
                {timeUnits.map((unit, index) => (
                    <div key={unit.label} className="flex flex-col items-center">
                        <div className="relative glass w-full aspect-square flex flex-col items-center justify-center rounded-2xl overflow-hidden group">
                            <div className="absolute inset-0 transition-colors duration-500" style={{ backgroundColor: 'var(--accent-soft)' }} />
                            <span className="text-2xl sm:text-3xl md:text-5xl font-light tracking-widest relative z-10 font-serif" style={{ color: 'var(--text-primary)' }}>
                                {unit.value}
                            </span>
                        </div>
                        <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] mt-4 font-medium font-sans" style={{ color: 'var(--text-muted)' }}>
                            {unit.label}
                        </span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
