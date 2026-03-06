"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, X, Sparkles, Navigation, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/admin-context";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Place {
    id: string;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    date: string;
    category: string;
    author?: string;
}

export function OurMap() {
    const { isAdmin, authorName } = useAdmin();
    const [places, setPlaces] = useState<Place[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clickLocation, setClickLocation] = useState<[number, number] | null>(null);
    const [newPlace, setNewPlace] = useState({
        name: "",
        description: "",
        category: "Date",
    });

    useEffect(() => {
        fetchPlaces();
    }, []);

    const fetchPlaces = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('memorable_places')
                .select('*')
                .order('created_at', { ascending: false });
            if (data) setPlaces(data);
        } catch (error) {
            console.error("Error fetching places:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPlace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlace.name || !clickLocation || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const dateStr = new Date().toLocaleDateString("en-US", {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });

            const { data, error } = await supabase
                .from('memorable_places')
                .insert([{
                    name: newPlace.name,
                    description: newPlace.description,
                    latitude: clickLocation[0],
                    longitude: clickLocation[1],
                    category: newPlace.category,
                    date: dateStr,
                    author: authorName
                }])
                .select();

            if (error) throw error;

            if (data) {
                setPlaces([data[0], ...places]);
                setNewPlace({ name: "", description: "", category: "Date" });
                setIsAdding(false);
                setClickLocation(null);
            }
        } catch (error) {
            console.error("Error adding place:", error);
            alert("Gagal menyimpan lokasi. Coba lagi ya!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePlace = async (id: string) => {
        if (!confirm("Hapus tempat ini?")) return;
        try {
            const { data, error } = await supabase
                .from('memorable_places')
                .delete()
                .eq('id', id)
                .select();
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Delete blocked');
            setPlaces(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting place:", error);
            alert("Gagal hapus lokasi.");
        }
    };

    function LocationMarker() {
        useMapEvents({
            click(e) {
                setClickLocation([e.latlng.lat, e.latlng.lng]);
                setIsAdding(true);
            },
        });
        return null;
    }

    // Custom heart icon
    const heartIcon = L.divIcon({
        html: `<div class="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-lg border-2 border-zinc-100 transform -translate-y-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#fc1c1c" stroke="#fc1c1c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
               </div>`,
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                    <Navigation className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--text-muted)' }} />
                    <h2 className="text-lg sm:text-2xl font-light font-serif italic" style={{ color: 'var(--text-secondary)' }}>Our Memorable Map</h2>
                </div>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest hidden sm:block" style={{ color: 'var(--text-muted)' }}>Click anywhere to pin a memory</p>
            </div>

            <div className="h-[350px] sm:h-[450px] md:h-[600px] w-full glass rounded-[1.5rem] sm:rounded-[3rem] overflow-hidden relative z-10">
                <MapContainer
                    center={[-6.2088, 106.8456]}
                    zoom={11}
                    style={{ height: "100%", width: "100%", background: "#f2efe9" }}
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />

                    <LocationMarker />

                    {places.map((place) => (
                        <Marker
                            key={place.id}
                            position={[place.latitude, place.longitude]}
                            icon={heartIcon}
                        >
                            <Popup className="custom-popup">
                                <div className="p-4 rounded-2xl min-w-[200px]" style={{ backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                                    <span className="text-[10px] uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-muted)' }}>{place.date}</span>
                                    <h3 className="text-lg font-serif italic mb-1">{place.name}</h3>
                                    <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>{place.description}</p>
                                    {place.author && <p className="text-[10px] italic mb-2" style={{ color: 'var(--text-muted)' }}>— {place.author}</p>}
                                    <div className="flex items-center justify-between">
                                        <span className="inline-block px-2 py-1 rounded-full text-[8px] uppercase tracking-widest" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                            {place.category}
                                        </span>
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDeletePlace(place.id)}
                                                className="hover:text-red-400 transition-colors p-1"
                                                style={{ color: 'var(--text-faint)' }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {loading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-white animate-pulse" />
                    </div>
                )}
            </div>

            {/* Add Place Modal */}
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
                            className="glass p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-2xl font-serif italic font-light" style={{ color: 'var(--text-primary)' }}>Pin this Memory</h3>
                                <button onClick={() => { setIsAdding(false); setClickLocation(null); }}><X className="w-6 h-6 transition-colors" style={{ color: 'var(--text-muted)' }} /></button>
                            </div>

                            <form onSubmit={handleAddPlace} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest pl-1" style={{ color: 'var(--text-muted)' }}>Name of Place</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Kafe Kenangan Pertama"
                                        value={newPlace.name}
                                        onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                                        className="w-full rounded-xl p-4 text-sm outline-none"
                                        style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest pl-1" style={{ color: 'var(--text-muted)' }}>Little Story</label>
                                    <textarea
                                        placeholder="What happened here?"
                                        value={newPlace.description}
                                        onChange={(e) => setNewPlace({ ...newPlace, description: e.target.value })}
                                        className="w-full h-24 rounded-xl p-4 text-sm outline-none resize-none"
                                        style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest pl-1" style={{ color: 'var(--text-muted)' }}>Category</label>
                                    <select
                                        value={newPlace.category}
                                        onChange={(e) => setNewPlace({ ...newPlace, category: e.target.value })}
                                        className="w-full rounded-xl p-4 text-sm outline-none appearance-none"
                                        style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="Date">Date</option>
                                        <option value="First Meet">First Meet</option>
                                        <option value="Special Moment">Special Moment</option>
                                        <option value="Travel">Travel</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!newPlace.name || isSubmitting}
                                    className="w-full p-5 rounded-2xl text-sm font-medium flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                                    style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                                >
                                    {isSubmitting ? <Sparkles className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                                    Save Memory
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-popup .leaflet-popup-content-wrapper {
                    background: transparent;
                    padding: 0;
                    box-shadow: none;
                }
                .custom-popup .leaflet-popup-tip {
                    background: var(--card);
                }
                .custom-popup .leaflet-popup-content {
                    margin: 0;
                }
                .leaflet-container {
                    font-family: inherit;
                }
            `}</style>
        </div>
    );
}

export default OurMap;
