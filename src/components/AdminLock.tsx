"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, X } from "lucide-react";
import { useAdmin } from "@/lib/admin-context";

export function AdminLock() {
    const { isAdmin, showPinModal, openPinModal, closePinModal, verifyPin, logout } = useAdmin();
    const [pin, setPin] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleOpenModal = () => {
        setPin(["", "", "", "", "", ""]);
        setError(false);
        openPinModal();
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
    };

    const handlePinChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value.slice(-1);
        setPin(newPin);
        setError(false);

        // Auto-focus next
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits entered
        const fullPin = newPin.join("");
        if (fullPin.length === 6) {
            const success = verifyPin(fullPin);
            if (!success) {
                setError(true);
                setPin(["", "", "", "", "", ""]);
                setTimeout(() => inputRefs.current[0]?.focus(), 200);
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <>
            {/* Floating Lock Button */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5 }}
                onClick={isAdmin ? logout : handleOpenModal}
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[90] w-10 h-10 sm:w-12 sm:h-12 rounded-full glass flex items-center justify-center transition-all group shadow-lg"
                title={isAdmin ? "Logout admin" : "Admin access"}
            >
                {isAdmin ? (
                    <Unlock className="w-4 h-4 text-green-400 group-hover:text-green-300 transition-colors" />
                ) : (
                    <Lock className="w-4 h-4 transition-colors" style={{ color: 'var(--text-muted)' }} />
                )}
            </motion.button>

            {/* PIN Modal */}
            <AnimatePresence>
                {showPinModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closePinModal}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl"
                        style={{ backgroundColor: 'var(--modal-overlay)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] max-w-sm w-full text-center"
                        >
                            <button
                                onClick={closePinModal}
                                className="absolute top-6 right-6 transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <Lock className="w-8 h-8 mx-auto mb-6" style={{ color: 'var(--text-muted)' }} />
                            <h3 className="text-xl font-serif italic font-light mb-2" style={{ color: 'var(--text-primary)' }}>
                                Admin Access
                            </h3>
                            <p className="text-[10px] uppercase tracking-[0.3em] mb-8" style={{ color: 'var(--text-muted)' }}>
                                Enter your secret PIN
                            </p>

                            {/* PIN Input */}
                            <div className="flex gap-3 justify-center mb-6">
                                {pin.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { inputRefs.current[i] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handlePinChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        className={`w-11 h-14 text-center text-xl font-mono rounded-xl border outline-none transition-all ${
                                            error
                                                ? "border-red-500/50 bg-red-500/5 text-red-400 animate-shake"
                                                : ""
                                        }`}
                                        style={!error ? {
                                            backgroundColor: 'var(--input-bg)',
                                            borderColor: digit ? 'var(--border-hover)' : 'var(--border)',
                                            color: 'var(--text-primary)'
                                        } : undefined}
                                    />
                                ))}
                            </div>

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-400/80 text-xs font-medium mb-4"
                                >
                                    Wrong PIN. Try again.
                                </motion.p>
                            )}

                            <p className="text-[9px] mt-4" style={{ color: 'var(--text-faint)' }}>
                                Only the creator can edit content.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
