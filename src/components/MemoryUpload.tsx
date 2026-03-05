"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, Plus, X, Loader2 } from "lucide-react";
import { Memory } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

interface MemoryUploadProps {
    onUpload: (memory: Memory) => void;
}

export function MemoryUpload({ onUpload }: MemoryUploadProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [curhatan, setCurhatan] = useState("");

    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !file) return;

        setIsUploading(true);
        try {
            // 1. Upload image to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('memories')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('memories')
                .getPublicUrl(filePath);

            // 3. Insert into Database
            const { data, error } = await supabase
                .from('memories')
                .insert([
                    {
                        date: new Date().toLocaleDateString("en-US", {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        }),
                        title,
                        description,
                        curhatan,
                        image_url: publicUrl
                    }
                ])
                .select();

            if (error) throw error;

            if (data && data[0]) {
                const newMemory: Memory = {
                    id: data[0].id,
                    date: data[0].date,
                    title: data[0].title,
                    description: data[0].description,
                    curhatan: data[0].curhatan,
                    imageUrl: data[0].image_url
                };
                onUpload(newMemory);
            }

            // Reset form
            setTitle("");
            setDescription("");
            setCurhatan("");
            setFile(null);
            setPreviewUrl(null);
            setIsOpen(false);
        } catch (error: any) {
            console.error('Error uploading memory:', error);
            // Show the actual error message to help debugging
            const errorMessage = error?.message || 'Unknown error occurred';
            alert(`Failed to save: ${errorMessage}. \n\nMake sure the "memories" Bucket is created and RLS Policy is set to Public.`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto mb-20 relative z-20">
            {!isOpen ? (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setIsOpen(true)}
                    className="w-full glass rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all group flex items-center justify-center gap-3 cursor-pointer"
                >
                    <Plus className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                    <span className="text-zinc-400 font-light tracking-widest uppercase text-sm group-hover:text-white transition-colors">
                        Add New Memory
                    </span>
                </motion.button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass rounded-3xl p-8 border border-white/10 relative"
                >
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="text-center mb-8">
                        <h3 className="text-xl font-light text-zinc-200 tracking-[0.2em] uppercase mb-2">New Memory</h3>
                        <p className="text-sm font-serif italic text-zinc-500">Capture a moment in monochrome.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Capture from Gallery</label>
                            <div className="relative group/upload">
                                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-white/20 hover:bg-white/[0.02] transition-all overflow-hidden relative">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <ImagePlus className="w-8 h-8 text-zinc-600 mb-3 group-hover/upload:text-zinc-400 transition-colors" />
                                            <p className="text-xs text-zinc-600 group-hover/upload:text-zinc-400 transition-colors uppercase tracking-widest">Select Photo</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        required={!previewUrl}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Late Night Drive"
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-white/30 transition-colors text-sm"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="A brief public description..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-white/30 transition-colors text-sm"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Handwritten Note (Hidden Message)</label>
                            <textarea
                                value={curhatan}
                                onChange={(e) => setCurhatan(e.target.value)}
                                placeholder="Your handwritten thoughts..."
                                className="w-full min-h-[100px] bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-white/30 transition-colors text-sm font-serif italic resize-y"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isUploading}
                            className="mt-4 w-full bg-white text-black rounded-xl py-4 font-bold tracking-widest uppercase hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                        >
                            {isUploading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Saving...</span>
                                </div>
                            ) : "Eternalize Moment"}
                        </button>
                    </form>
                </motion.div>
            )}
        </div>
    );
}
