"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { MOCK_BUCKETLIST, BucketItem } from "@/lib/mock-data";

export function BucketList() {
    const [items, setItems] = useState<BucketItem[]>(MOCK_BUCKETLIST);

    const toggleItem = (id: string) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
        ));
    };

    return (
        <div className="w-full relative py-12">
            <div className="text-center mb-12">
                <h3 className="text-2xl font-light text-zinc-300 tracking-[0.2em] uppercase mb-4">
                    Our Bucket List
                </h3>
                <div className="w-12 h-[1px] bg-white/20 mx-auto mb-4" />
                <p className="text-zinc-500 font-serif italic text-sm">
                    Promises to keep. Places to go.
                </p>
            </div>

            <div className="max-w-2xl mx-auto flex flex-col gap-4">
                <AnimatePresence>
                    {items.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-4 group hover:bg-white/[0.04] transition-colors cursor-pointer"
                            onClick={() => toggleItem(item.id)}
                        >
                            {/* Custom Checkbox */}
                            <div
                                className={`w-6 h-6 rounded-full border flex flex-shrink-0 items-center justify-center transition-all duration-300 ${item.isCompleted
                                        ? "bg-zinc-200 border-zinc-200 text-black"
                                        : "border-zinc-700 text-transparent group-hover:border-zinc-500"
                                    }`}
                            >
                                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            </div>

                            {/* Item Title with Strikethrough Animation */}
                            <div className="relative flex-1 py-1">
                                <span
                                    className={`text-lg font-light transition-colors duration-500 ${item.isCompleted ? "text-zinc-600" : "text-zinc-200"
                                        }`}
                                >
                                    {item.title}
                                </span>

                                {/* Animated Strikethrough Line */}
                                <motion.div
                                    initial={false}
                                    animate={{
                                        width: item.isCompleted ? "100%" : "0%",
                                        opacity: item.isCompleted ? 1 : 0
                                    }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] bg-zinc-600 origin-left"
                                />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Minimalist Note */}
            <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
                className="text-center text-xs text-zinc-600 mt-12 tracking-widest uppercase"
            >
                To be continued...
            </motion.p>
        </div>
    );
}
