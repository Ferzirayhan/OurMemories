"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ImagePlus, Plus, X, Loader2 } from "lucide-react";
import { Memory } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/admin-context";
import { sendPushNotification } from "@/lib/push-notifications";

interface MemoryUploadProps {
    onUpload: (memory: Memory) => void;
}

// Compress image using canvas — max 1200px, quality 0.8
async function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<File> {
    // Skip non-image files or already small files (< 500KB)
    if (!file.type.startsWith("image/") || file.size < 500 * 1024) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;

            // Calculate new dimensions maintaining aspect ratio
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) { resolve(file); return; }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) { resolve(file); return; }
                    const compressed = new File([blob], file.name, {
                        type: "image/jpeg",
                        lastModified: Date.now(),
                    });
                    // Only use compressed if it's actually smaller
                    resolve(compressed.size < file.size ? compressed : file);
                },
                "image/jpeg",
                quality
            );
        };
        img.onerror = () => reject(new Error("Failed to load image for compression"));
        img.src = URL.createObjectURL(file);
    });
}

export function MemoryUpload({ onUpload }: MemoryUploadProps) {
    const { authorName } = useAdmin();
    const [isOpen, setIsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [curhatan, setCurhatan] = useState("");

    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setPreviewUrl(URL.createObjectURL(selectedFile));
            try {
                const compressed = await compressImage(selectedFile);
                setFile(compressed);
            } catch {
                setFile(selectedFile);
            }
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

            const { error: uploadError } = await supabase.storage
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
                        image_url: publicUrl,
                        author: authorName
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
                    imageUrl: data[0].image_url,
                    author: data[0].author
                };
                onUpload(newMemory);
                sendPushNotification({ author: authorName, title: "📸 New Memory!", body: `${authorName} added: ${data[0].title}`, url: "/memories", tag: "memory" });
            }

            // Reset form
            setTitle("");
            setDescription("");
            setCurhatan("");
            setFile(null);
            setPreviewUrl(null);
            setIsOpen(false);
        } catch (err: unknown) {
            console.error('Error uploading memory:', err);
            // Show the actual error message to help debugging
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
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
                    className="w-full glass rounded-3xl p-6 transition-all group flex items-center justify-center gap-3 cursor-pointer"
                >
                    <Plus className="w-5 h-5 transition-colors" style={{ color: 'var(--text-muted)' }} />
                    <span className="font-light tracking-widest uppercase text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
                        Add New Memory
                    </span>
                </motion.button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative"
                >
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-6 right-6 transition-colors" style={{ color: 'var(--text-muted)' }}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="text-center mb-8">
                        <h3 className="text-xl font-light tracking-[0.2em] uppercase mb-2" style={{ color: 'var(--text-primary)' }}>New Memory</h3>
                        <p className="text-sm font-serif italic" style={{ color: 'var(--text-muted)' }}>Capture a moment in monochrome.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--text-muted)' }}>Capture from Gallery</label>
                            <div className="relative group/upload">
                                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden relative" style={{ borderColor: 'var(--border)' }}>
                                    {previewUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <ImagePlus className="w-8 h-8 mb-3 transition-colors" style={{ color: 'var(--text-faint)' }} />
                                            <p className="text-xs transition-colors uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Select Photo</p>
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
                            <label className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--text-muted)' }}>Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Late Night Drive"
                                className="w-full rounded-xl py-3 px-4 focus:outline-none transition-colors text-sm"
                                style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--text-muted)' }}>Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="A brief public description..."
                                className="w-full rounded-xl py-3 px-4 focus:outline-none transition-colors text-sm"
                                style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--text-muted)' }}>Handwritten Note (Hidden Message)</label>
                            <textarea
                                value={curhatan}
                                onChange={(e) => setCurhatan(e.target.value)}
                                placeholder="Your handwritten thoughts..."
                                className="w-full min-h-25 rounded-xl py-3 px-4 focus:outline-none transition-colors text-sm font-serif italic resize-y"
                                style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isUploading}
                            className="mt-4 w-full rounded-xl py-4 font-bold tracking-widest uppercase active:scale-[0.98] transition-all disabled:opacity-50"
                            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
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
