"use client";

import { useState, useEffect, ComponentType } from "react";
import dynamic from "next/dynamic";
import { Heart, ShieldCheck, Flame, Droplets, Activity, Zap } from "lucide-react";
import api from "@/lib/api";

interface ResourceLeafletMapProps {
    center: [number, number];
    pins: any[];
}

const ResourceLeafletMap = dynamic<ResourceLeafletMapProps>(
    () => import("./resource-leaflet-map"),
    { ssr: false }
);

const LAYERS = [
    { key: "hospitals", label: "Hospitals", icon: Heart, color: "#FF3B30", letter: "H" },
    { key: "pharmacies", label: "Pharmacies", icon: Activity, color: "#34C759", letter: "D" },
    { key: "policeStations", label: "Police Stations", icon: ShieldCheck, color: "#161618", letter: "P" },
    { key: "fireStations", label: "Fire Stations", icon: Flame, color: "#FF9F0A", letter: "F" },
    { key: "fireHydrants", label: "Fire Hydrants", icon: Droplets, color: "#00BCD4", letter: "H" },
    { key: "aed", label: "AED Locations", icon: Zap, color: "#9C27B0", letter: "A" },
];

export default function ResourceMapCard() {
    const [center, setCenter] = useState<[number, number]>([28.6139, 77.2090]);
    const [resources, setResources] = useState<Record<string, any[]>>({});
    const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({
        hospitals: true, pharmacies: true, policeStations: true,
        fireStations: true, fireHydrants: true, aed: true,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            pos => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setCenter([lat, lng]);
                fetchResources(lat, lng);
            },
            () => fetchResources(28.6139, 77.2090)
        );
    }, []);

    const fetchResources = async (lat: number, lng: number) => {
        try {
            const { data } = await api.get(`/map/resources?lat=${lat}&lng=${lng}`);
            setResources(data);
        } catch {
            // fallback to empty
        } finally {
            setLoading(false);
        }
    };

    const toggleLayer = (key: string) => {
        setVisibleLayers(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const activeItems = LAYERS.flatMap(layer =>
        visibleLayers[layer.key] ? (resources[layer.key] || []).map((p: any) => ({ ...p, layerColor: layer.color, layerLetter: layer.letter })) : []
    );

    return (
        <div className="flex flex-col h-full rounded-3xl border border-[#E5E5E5] bg-white overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
                <div>
                    <h2 className="text-base font-semibold text-[#161618]">Resource Map</h2>
                    <p className="text-xs text-[#A0A0A8] mt-0.5">Hospitals, AEDs, Police, Fire Stations nearby</p>
                </div>
                {loading && <span className="text-xs text-[#A0A0A8]">Loading...</span>}
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Layer Toggle Panel */}
                <div className="w-52 shrink-0 border-r border-[#E5E5E5] bg-[#F8F8FA] p-4 overflow-y-auto">
                    <p className="text-xs font-bold text-[#161618] mb-3 uppercase tracking-wider">Map Layers</p>
                    {LAYERS.map(({ key, label, icon: Icon, color }) => (
                        <button
                            key={key}
                            onClick={() => toggleLayer(key)}
                            className="flex items-center justify-between w-full py-2.5 border-b border-[#F0F0F0] last:border-0"
                        >
                            <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" style={{ color }} />
                                <span className="text-xs font-medium text-[#161618]">{label}</span>
                            </div>
                            <div className={`w-8 h-4 rounded-full transition-colors ${visibleLayers[key] ? 'bg-[#161618]' : 'bg-[#E5E5E5]'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-all ${visibleLayers[key] ? 'ml-4' : 'ml-0.5'}`} />
                            </div>
                        </button>
                    ))}
                    <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                        <p className="text-xs text-[#A0A0A8]">Within 5km radius of your location</p>
                    </div>
                </div>

                {/* Map */}
                <div className="flex-1 relative">
                    {!loading && (
                        <ResourceLeafletMap center={center} pins={activeItems} />
                    )}
                </div>
            </div>
        </div>
    );
}
