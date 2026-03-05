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
            <div className="glass px-6 py-3 rounded-full border border-white/10 flex items-center gap-8 pointer-events-auto backdrop-blur-xl bg-black/40">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="relative px-2 py-1"
                        >
                            <span
                                className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${isActive ? "text-white font-medium" : "text-zinc-500 hover:text-zinc-300 font-light"
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
        </nav>
    );
}
