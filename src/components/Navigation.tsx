"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export function Navigation() {
    const pathname = usePathname();

    const links = [
        { href: "/", label: "Home" },
        { href: "/memories", label: "Memories" }
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-8 pointer-events-none">
            <div className="glass px-6 py-3 rounded-full border border-white/10 flex items-center gap-6 pointer-events-auto backdrop-blur-xl bg-black/40">
                <Link href="/" className="flex items-center gap-2 pr-4 border-r border-white/10 group">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
                        <img src="/logo.png" alt="ER Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-serif tracking-widest text-white/90 group-hover:text-white transition-colors">OurMemories</span>
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
                                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 font-sans ${isActive ? "text-white font-medium" : "text-zinc-500 hover:text-zinc-300 font-light"
                                        }`}
                                >
                                    {link.label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        className="absolute -bottom-1 left-0 right-0 h-[1px] bg-white"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </nav>
    );
}
