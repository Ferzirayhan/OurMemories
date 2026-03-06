"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export function Navigation() {
    const pathname = usePathname();
    const { theme, toggleTheme, isDark } = useTheme();

    const links = [
        { href: "/memories", label: "Memories" },
        { href: "/secret-space", label: "Secret Space" }
    ];

    return (
        <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex justify-center w-max">
            <div className="glass px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl"
                style={{ backgroundColor: 'var(--nav-bg)' }}
            >
                <Link href="/" className="flex items-center gap-2 pr-4 border-r group" style={{ borderColor: 'var(--border)' }}>
                    <div className="w-6 h-6 rounded-full overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                        <img src="/logo.png" alt="ER Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-serif tracking-widest transition-colors" style={{ color: 'var(--text-primary)' }}>OurMemories</span>
                </Link>
                <div className="flex items-center gap-8">
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="relative px-2 py-1"
                            >
                                <span
                                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 font-sans`}
                                    style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isActive ? 500 : 300 }}
                                >
                                    {link.label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        className="absolute -bottom-1 left-0 right-0 h-[1px]"
                                        style={{ backgroundColor: 'var(--text-primary)' }}
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="ml-2 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    style={{ backgroundColor: 'var(--input-bg)' }}
                    title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                    <motion.div
                        key={theme}
                        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {isDark ? (
                            <Sun className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                        ) : (
                            <Moon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                        )}
                    </motion.div>
                </button>
            </div>
        </nav>
    );
}
