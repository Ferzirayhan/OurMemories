"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, MessageCircle, Heart, Star, Camera, Coffee, MapPin, Plus, Send, X, Trash2 } from "lucide-react";
import { Milestone } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/admin-context";

const ICON_MAP: Record<string, any> = {
    Eye,
    MessageCircle,
    Heart,
    Star,
    Camera,
    Coffee,
    MapPin
};

const AVAILABLE_ICONS = ["Heart", "Star", "Camera", "Coffee", "MapPin", "MessageCircle", "Eye"];

export function MilestoneTimeline() {
    const { isAdmin, authorName } = useAdmin();
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newMilestone, setNewMilestone] = useState({
        title: "",
        description: "",
        date: "",
        icon: "Heart"
    });

    useEffect(() => {
        fetchMilestones();
    }, []);

    const fetchMilestones = async () => {
        const { data } = await supabase
            .from('milestones')
            .select('*')
            .order('created_at', { ascending: true });

        if (data) setMilestones(data);
    };

    const handleCreateMilestone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMilestone.title || !newMilestone.date || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('milestones')
                .insert([{ ...newMilestone, author: authorName }])
                .select();

            if (error) throw error;
            if (data) {
                setMilestones(prev => [...prev, data[0]].sort((a, b) => new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime()));
                setIsAdding(false);
                setNewMilestone({ title: "", description: "", date: "", icon: "Heart" });
            }
        } catch (error) {
            console.error("Error creating milestone:", error);
            alert("Gagal menambah milestone.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteMilestone = async (id: string) => {
        if (!confirm("Hapus milestone ini?")) return;
        try {
            const { data, error } = await supabase
                .from('milestones')
                .delete()
                .eq('id', id)
                .select();
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Delete blocked');
            setMilestones(prev => prev.filter(m => m.id !== id));
        } catch (error) {
            console.error("Error deleting milestone:", error);
            alert("Gagal hapus milestone.");
        }
    };

    return (
        <>
            <div className="py-12 relative">
                {/* Header with Add Button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-16 relative z-10 px-4 sm:px-8 gap-3">
                    <div>
                        <h2 className="text-sm font-medium uppercase tracking-[0.4em]" style={{ color: 'var(--text-muted)' }}>Our Journey</h2>
                        <p className="font-serif italic text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Every first step we took together.</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="glass px-4 py-2 rounded-full text-[10px] flex items-center gap-2 transition-all uppercase tracking-widest"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <Plus className="w-3 h-3" />
                        Add Milestone
                    </button>
                </div>

                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] hidden md:block" style={{ background: 'linear-gradient(to bottom, transparent, var(--border), transparent)' }} />

                <div className="relative z-10 space-y-12 sm:space-y-24">
                    {milestones.map((milestone, index) => {
                        const IconComponent = ICON_MAP[milestone.icon] || Heart;
                        const isEven = index % 2 === 0;

                        return (
                            <motion.div
                                key={milestone.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className={`flex items-center justify-center w-full flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                            >
                                {/* Content */}
                                <div className="w-full md:w-1/2 px-4 sm:px-8 flex flex-col items-center text-center md:items-start md:text-left order-2 md:order-none mt-4 md:mt-0">
                                    <span className="text-[10px] uppercase tracking-[0.3em] mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                                        {milestone.date}
                                    </span>
                                    <h3 className="text-2xl font-light mb-2 font-serif italic" style={{ color: 'var(--text-primary)' }}>{milestone.title}</h3>
                                    <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>{milestone.description}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        {milestone.author && <span className="text-[10px] font-serif italic" style={{ color: 'var(--text-faint)' }}>— {milestone.author}</span>}
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDeleteMilestone(milestone.id)}
                                                className="hover:text-red-400 transition-colors"
                                                style={{ color: 'var(--text-faint)' }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Center Icon */}
                                <div className="relative z-20 order-1 md:order-none">
                                    <motion.div
                                        whileInView={{ scale: [0, 1.2, 1] }}
                                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-full glass flex items-center justify-center"
                                    >
                                        <IconComponent className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: 'var(--text-secondary)' }} />
                                    </motion.div>
                                </div>

                                {/* Spacer for symmetry */}
                                <div className="w-1/2 px-8 hidden md:block" />
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Add Milestone Modal */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md"
                        style={{ backgroundColor: 'var(--modal-overlay)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] max-w-lg w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-2xl font-serif italic font-light" style={{ color: 'var(--text-primary)' }}>New Milestone</h3>
                                <button onClick={() => setIsAdding(false)}><X className="w-6 h-6 transition-colors" style={{ color: 'var(--text-muted)' }} /></button>
                            </div>
                            <form onSubmit={handleCreateMilestone} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest pl-1" style={{ color: 'var(--text-muted)' }}>What happened?</label>
                                    <input
                                        type="text"
                                        placeholder="Our First Date, First Kiss, etc."
                                        value={newMilestone.title}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                                        className="w-full rounded-xl p-4 text-sm outline-none"
                                        style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest pl-1" style={{ color: 'var(--text-muted)' }}>When?</label>
                                        <input
                                            type="text"
                                            placeholder="February 14, 2026"
                                            value={newMilestone.date}
                                            onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                                            className="w-full rounded-xl p-4 text-sm outline-none"
                                            style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest pl-1" style={{ color: 'var(--text-muted)' }}>Icon</label>
                                        <select
                                            value={newMilestone.icon}
                                            onChange={(e) => setNewMilestone({ ...newMilestone, icon: e.target.value })}
                                            className="w-full rounded-xl p-4 text-sm outline-none appearance-none cursor-pointer"
                                            style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        >
                                            {AVAILABLE_ICONS.map(icon => (
                                                <option key={icon} value={icon}>{icon}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest pl-1" style={{ color: 'var(--text-muted)' }}>Little Detail</label>
                                    <textarea
                                        placeholder="It was raining, and you looked beautiful..."
                                        value={newMilestone.description}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                                        className="w-full h-24 rounded-xl p-4 text-sm outline-none resize-none"
                                        style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!newMilestone.title || !newMilestone.date || isSubmitting}
                                    className="w-full p-5 rounded-2xl text-sm font-medium flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                                    style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                                >
                                    {isSubmitting ? <Plus className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Record Milestone
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );

}
