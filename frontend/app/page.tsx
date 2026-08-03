"use client";

import { useState, useEffect } from "react";
import { MapPin, Phone, HeartHandshake, AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";
import EmergencyModal from "@/components/emergency-modal";
import api from "@/lib/api";

interface AnonMapProps {
    center: [number, number];
    pin: { lat: number; lng: number } | null;
    onPinSet: (lat: number, lng: number) => void;
}

const AnonMap = dynamic<AnonMapProps>(
    () => import("./anon-map"),
    { ssr: false }
);

import { connectSocket, getSocket } from "@/lib/socket";
import MutualResponseView from "@/components/dashboard/mutual-response-view";

const SOS_TYPES = [
    { id: "Medical", label: "Medical" },
    { id: "Car Problem", label: "Car Problem" },
    { id: "Fire", label: "Fire" },
    { id: "Gas Leak", label: "Gas Leak" },
    { id: "Threat", label: "Threat" },
    { id: "General", label: "General Help" },
];

export default function AnonymousPage() {
    const [showEmergency, setShowEmergency] = useState(false);
    const [locationData, setLocationData] = useState<{ lat: number; lng: number } | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]);
    const [anonName, setAnonName] = useState("");
    const [bloodGroup, setBloodGroup] = useState("");
    const [landmark, setLandmark] = useState("");
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [guidance, setGuidance] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // For socket connection:
    const [sessionId] = useState(() => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)));
    const [mutualPayload, setMutualPayload] = useState<any>(null);

    const detectLocation = () => {
        if (!navigator.geolocation) return setError("Geolocation not supported on this device.");
        navigator.geolocation.getCurrentPosition(
            pos => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setLocationData({ lat, lng });
                setMapCenter([lat, lng]);
                setError("");
            },
            () => setError("Could not detect location. Click on the map to set it manually.")
        );
    };

    // Auto-detect silently on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    const { latitude: lat, longitude: lng } = pos.coords;
                    setLocationData({ lat, lng });
                    setMapCenter([lat, lng]);
                },
                () => { } // silent fail — user can click button manually
            );
        }
    }, []);

    const handleSubmit = async () => {
        if (!selectedType) return setError("Please select an emergency type.");
        if (!locationData) return setError("Please provide your location.");
        setLoading(true);
        setError("");
        try {
            const { data } = await api.post('/sos/anonymous', {
                type: selectedType,
                lat: locationData.lat,
                lng: locationData.lng,
                anonymousName: anonName || 'Anonymous User',
                anonymousBloodGroup: bloodGroup,
                modalData: { landmark },
                sessionId
            });
            setSubmitted(true);

            // Connect using the anonymous session ID bypass
            const tokenOverride = `anonymous:${sessionId}`;
            const { setAccessToken } = await import('@/lib/api');
            setAccessToken(tokenOverride);
            const socket = connectSocket(tokenOverride);
            socket.emit('sos:join', { sosId: data.sos?.id });
            socket.on('response:mutual_open', (payload: any) => {
                setMutualPayload(payload);
            });

            // Listen for guidance via polling as fallback or fast load
            const sosId = data.sos?.id;
            if (sosId) {
                let attempts = 0;
                const poll = setInterval(async () => {
                    attempts++;
                    const { data: sos } = await api.get(`/sos/${sosId}`);
                    if (sos?.first_response_guidance) {
                        setGuidance(sos.first_response_guidance);
                        clearInterval(poll);
                    }
                    if (attempts > 10) clearInterval(poll);
                }, 3000);
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to send SOS. Try again.");
        } finally {
            setLoading(false);
        }
    };

    if (mutualPayload) {
        return (
            <div className="min-h-screen bg-[#F8F8FA] w-full p-4 lg:p-8 flex flex-col justify-center items-center">
                <div className="w-full max-w-6xl h-[80vh] bg-white rounded-2xl shadow-xl overflow-hidden">
                    <MutualResponseView
                        payload={mutualPayload}
                        currentUser={{ id: sessionId, name: anonName || 'Anonymous User', role: 'seeker' }}
                        onClose={() => setMutualPayload(null)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F8FA] text-[#161618]">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-[#E5E5E5]">
                <a href="/" className="text-lg font-black tracking-tight text-[#161618]">AetherNet</a>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowEmergency(true)}
                        className="bg-[#FF3B30] border-2 border-[#CC2A20] rounded-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#CC2A20] transition-colors"
                    >
                        <Phone className="w-4 h-4 text-white" />
                        <span className="text-white text-sm font-semibold">Emergency</span>
                    </button>
                    <a href="/auth/login" className="bg-[#161618] text-white rounded-full px-4 py-1.5 text-sm font-medium hover:bg-[#2a2a2e] transition-colors">
                        Sign In
                    </a>
                </div>
            </nav>

            <div className="pt-24 pb-12 px-4 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left — Anonymous SOS */}
                <div className="bg-[#161618] rounded-3xl p-8 text-white">
                    <h1 className="text-2xl font-bold text-white mb-1">Anonymous Emergency SOS</h1>
                    <p className="text-[#A0A0A8] text-sm mb-4">No account needed. Your identity is protected.</p>

                    <div className="bg-[#1E1E22] border border-[#2a2a2e] rounded-xl p-3 text-sm text-[#A0A0A8] mb-6">
                        Responders will see you as Anonymous User. Only provide what you are comfortable sharing.
                    </div>

                    {submitted ? (
                        <div className="space-y-4">
                            <div className="bg-[#1E1E22] rounded-2xl p-4 border border-[#2a2a2e]">
                                <p className="text-sm font-semibold text-[#34C759] mb-2">SOS Sent — Nearby users notified</p>
                                <p className="text-xs text-[#A0A0A8]">Stay in a safe location. Keep this page open.</p>
                            </div>
                            {guidance && (
                                <div className="bg-[#1E1E22] rounded-2xl p-4 border border-[#FF3B30]/30">
                                    <p className="text-xs font-bold text-[#FF3B30] uppercase tracking-wider mb-2">First Response Guidance</p>
                                    <p className="text-sm text-[#F5F5F5] whitespace-pre-line">{guidance}</p>
                                </div>
                            )}
                            {!guidance && (
                                <p className="text-xs text-[#A0A0A8]">Generating guidance...</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-[#A0A0A8] mb-1">Display name (optional)</label>
                                <input
                                    value={anonName}
                                    onChange={e => setAnonName(e.target.value)}
                                    placeholder="Anonymous"
                                    className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-lg p-3 text-white text-sm focus:outline-none focus:border-[#FF3B30]/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[#A0A0A8] mb-1">Blood group (optional)</label>
                                <select
                                    value={bloodGroup}
                                    onChange={e => setBloodGroup(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-lg p-3 text-white text-sm focus:outline-none"
                                >
                                    <option value="">Select...</option>
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-[#A0A0A8] mb-1">Rough area / landmark (optional)</label>
                                <input
                                    value={landmark}
                                    onChange={e => setLandmark(e.target.value)}
                                    placeholder="Near Connaught Place metro..."
                                    className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-lg p-3 text-white text-sm focus:outline-none focus:border-[#FF3B30]/50"
                                />
                            </div>
                            <button
                                onClick={detectLocation}
                                className="bg-[#1E1E22] border border-[#2a2a2e] rounded-xl px-4 py-2 text-sm text-white flex items-center gap-2 hover:bg-[#2a2a2e] transition-colors"
                            >
                                <MapPin className="w-4 h-4" />
                                {locationData ? `${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}` : 'Detect My Location'}
                            </button>

                            {/* Mini map */}
                            <div className="h-36 rounded-xl overflow-hidden border border-[#2a2a2e]">
                                <AnonMap
                                    center={mapCenter}
                                    pin={locationData}
                                    onPinSet={(lat: number, lng: number) => {
                                        setLocationData({ lat, lng });
                                        setMapCenter([lat, lng]);
                                    }}
                                />
                            </div>

                            {/* SOS type grid */}
                            <p className="text-xs text-[#A0A0A8] mt-2">Select emergency type</p>
                            <div className="grid grid-cols-2 gap-2">
                                {SOS_TYPES.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedType(t.id)}
                                        className={`p-3 border rounded-xl text-sm font-medium text-left transition-colors ${selectedType === t.id
                                            ? 'border-[#FF3B30] bg-[#FF3B30]/10 text-white'
                                            : 'border-[#2a2a2e] bg-[#0a0a0a] text-[#A0A0A8] hover:border-[#FF3B30]/50'
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {error && <p className="text-xs text-[#FF3B30]">{error}</p>}

                            <button
                                onClick={handleSubmit}
                                disabled={loading || !selectedType}
                                className="w-full bg-[#FF3B30] hover:bg-[#CC2A20] disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors mt-2"
                            >
                                {loading ? "Sending..." : "Send Anonymous SOS"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right — Support Resources */}
                <div className="bg-white border border-[#E5E5E5] rounded-3xl p-8">
                    <h2 className="text-xl font-bold text-[#161618] mb-1">Need to talk?</h2>
                    <p className="text-[#555] text-sm mb-6">You are not alone. Trained counsellors are available 24/7.</p>

                    <div className="flex flex-col gap-4">
                        <div className="bg-[#161618] rounded-2xl p-5">
                            <div className="flex items-start gap-4">
                                <HeartHandshake className="w-6 h-6 text-white mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <p className="font-bold text-white">Vandrevala Foundation</p>
                                    <p className="text-[#A0A0A8] text-sm mt-0.5">24/7 Mental Health Helpline</p>
                                    <p className="text-[#A0A0A8] text-xs mt-1">1860-2662-345</p>
                                    <button
                                        onClick={() => { window.location.href = 'tel:18602662345'; }}
                                        className="mt-3 bg-white text-[#161618] rounded-xl px-4 py-2 text-sm font-semibold w-full"
                                    >
                                        Call Now
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#F8F8FA] border border-[#E5E5E5] rounded-2xl p-5">
                            <div className="flex items-start gap-4">
                                <Phone className="w-6 h-6 text-[#161618] mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <p className="font-bold text-[#161618]">iCall — TISS</p>
                                    <p className="text-[#555] text-sm mt-0.5">Free psychological counselling</p>
                                    <p className="text-[#888] text-xs mt-1">9152987821</p>
                                    <button
                                        onClick={() => { window.location.href = 'tel:9152987821'; }}
                                        className="mt-3 bg-[#161618] text-white rounded-xl px-4 py-2 text-sm font-semibold w-full"
                                    >
                                        Call Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-[#A0A0A8] text-xs text-center mt-4">
                        Calls open your phone dialer. AetherNet does not handle call routing.
                    </p>
                </div>
            </div>

            {showEmergency && <EmergencyModal onClose={() => setShowEmergency(false)} />}
        </div>
    );
}
