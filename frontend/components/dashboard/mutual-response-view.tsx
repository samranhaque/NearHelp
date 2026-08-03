"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send, CheckCircle, Star, Heart, Flame, Car, Wind, Zap,
    Building2, Baby, PawPrint, Utensils, ShieldAlert, Scale,
    Waves, Users, HelpCircle, MapPin, X, ShieldCheck, AlertCircle
} from "lucide-react";
import api from "../../lib/api";
import { getSocket } from "../../lib/socket";

const MutualMap = dynamic(() => import("./mutual-map"), { ssr: false });

const TYPE_CONFIG: Record<string, { icon: any; color: string; textColor: string }> = {
    Medical: { icon: Heart, color: "bg-[#FF3B30]/10 border-[#FF3B30]/20", textColor: "text-[#FF3B30]" },
    Fire: { icon: Flame, color: "bg-orange-50 border-orange-100", textColor: "text-orange-600" },
    "Car Problem": { icon: Car, color: "bg-amber-50 border-amber-100", textColor: "text-amber-600" },
    "Gas Leak": { icon: Wind, color: "bg-yellow-50 border-yellow-100", textColor: "text-yellow-600" },
    Electrical: { icon: Zap, color: "bg-yellow-50 border-yellow-100", textColor: "text-yellow-500" },
    "Structural Collapse": { icon: Building2, color: "bg-stone-50 border-stone-100", textColor: "text-stone-600" },
    "Child in Danger": { icon: Baby, color: "bg-pink-50 border-pink-100", textColor: "text-pink-600" },
    "Pet Rescue": { icon: PawPrint, color: "bg-lime-50 border-lime-100", textColor: "text-lime-600" },
    "Food / Shelter": { icon: Utensils, color: "bg-green-50 border-green-100", textColor: "text-green-600" },
    "Threat to Safety": { icon: ShieldAlert, color: "bg-purple-50 border-purple-100", textColor: "text-purple-600" },
    "Legal Emergency": { icon: Scale, color: "bg-indigo-50 border-indigo-100", textColor: "text-indigo-600" },
    "Flood / Water": { icon: Waves, color: "bg-blue-50 border-blue-100", textColor: "text-blue-600" },
    "Mental Health Crisis": { icon: Users, color: "bg-violet-50 border-violet-100", textColor: "text-violet-600" },
    "Elderly Care": { icon: Heart, color: "bg-rose-50 border-rose-100", textColor: "text-rose-600" },
    "General Help": { icon: HelpCircle, color: "bg-gray-50 border-gray-100", textColor: "text-gray-600" },
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface MutualPayload {
    sosId: string;
    _id?: string;
    sosType: string;
    modalData?: any;
    seeker: { id: string; _id?: string; name: string; lat: number; lng: number; bloodGroup?: string; healthConditions?: string };
    responder: { id: string; _id?: string; name: string; lat: number; lng: number; skills?: string[]; trustScore?: number };
    seekerLocation?: { lat: number; lng: number };
}

interface ChatMessage {
    senderId: string;
    senderName: string;
    message: string;
    timestamp: number;
    system?: boolean;
}

interface MutualResponseViewProps {
    payload: MutualPayload;
    currentUser: any;
    onClose: () => void;
}

export default function MutualResponseView({ payload, currentUser, onClose }: MutualResponseViewProps) {
    const { sosId, sosType, modalData, seeker, responder } = payload;
    const isSelf = currentUser?.id === seeker?.id || currentUser?._id === seeker?.id;
    const userRole: "seeker" | "responder" = isSelf ? "seeker" : "responder";

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [responderPos, setResponderPos] = useState({ lat: responder?.lat, lng: responder?.lng });
    const [seekerPos, setSeekerPos] = useState({ lat: seeker?.lat ?? payload.seekerLocation?.lat, lng: seeker?.lng ?? payload.seekerLocation?.lng });
    const [resolved, setResolved] = useState(false);
    const [resolving, setResolving] = useState(false);
    const [responseTime, setResponseTime] = useState<number | null>(null);
    const [rating, setRating] = useState(0);
    const [hoveredStar, setHoveredStar] = useState(0);
    const [review, setReview] = useState("");
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const socket = getSocket();
    const effectiveSosId = sosId || payload._id;

    // Load existing chat log
    useEffect(() => {
        if (!effectiveSosId) return;
        api.get(`/sos/${effectiveSosId}`).then(({ data }) => {
            const log: ChatMessage[] = (data?.chat_log || []).map((c: any) => ({
                senderId: c.sender || c.senderId,
                senderName: c.senderName || (c.sender === seeker.id ? seeker.name : responder.name),
                message: c.message || c.text,
                timestamp: c.timestamp,
            }));
            setMessages(log);
        }).catch(() => { });

        // System message: responder joined
        setMessages(prev => [...prev, {
            senderId: "system",
            senderName: "",
            message: userRole === "seeker" ? `${responder.name} is responding to your SOS.` : "You have joined as a responder.",
            timestamp: Date.now(),
            system: true,
        }]);
    }, [effectiveSosId]);

    // Socket: join rooms, listen for messages
    useEffect(() => {
        if (!socket || !effectiveSosId) return;
        socket.emit("sos:join", { sosId: effectiveSosId });

        const onChatMsg = (data: any) => {
            setMessages(prev => [...prev, {
                senderId: data.senderId,
                senderName: data.senderName,
                message: data.message,
                timestamp: data.timestamp || Date.now(),
            }]);
        };
        const onTyping = (data: any) => {
            setTypingUser(data.senderName);
            setTimeout(() => setTypingUser(null), 2000);
        };
        const onResolved = (data: any) => {
            setResolved(true);
            if (data.responseTimeSeconds) setResponseTime(data.responseTimeSeconds);
            setMessages(prev => [...prev, { senderId: "system", senderName: "", message: "Incident has been resolved.", timestamp: Date.now(), system: true }]);
        };
        const onResponderMoved = (data: any) => {
            if (data.sosId === effectiveSosId) setResponderPos({ lat: data.lat, lng: data.lng });
        };
        const onSelfConfirmed = (data: any) => {
            if (userRole === "responder") setResponderPos({ lat: data.lat, lng: data.lng });
        };

        socket.on("chat:message", onChatMsg);
        socket.on("chat:typing", onTyping);
        socket.on("sos:resolved", onResolved);
        socket.on("location:responder_moved", onResponderMoved);
        socket.on("location:self_confirmed", onSelfConfirmed);

        return () => {
            socket.off("chat:message", onChatMsg);
            socket.off("chat:typing", onTyping);
            socket.off("sos:resolved", onResolved);
            socket.off("location:responder_moved", onResponderMoved);
            socket.off("location:self_confirmed", onSelfConfirmed);
        };
    }, [socket, effectiveSosId]);

    // STEP 1 — On component mount, get REAL GPS for responder
    useEffect(() => {
        if (userRole !== "responder") return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const realLat = pos.coords.latitude;
                const realLng = pos.coords.longitude;

                // Update responder position state with real GPS
                setResponderPos({ lat: realLat, lng: realLng });

                // Persist to backend immediately
                api.put('/users/location', { lat: realLat, lng: realLng });

                // Emit to socket so seeker's map updates
                if (socket) socket.emit('location:update', { lat: realLat, lng: realLng });
            },
            (err) => {
                console.warn('GPS unavailable, using stored location');
                // Use responder's stored location from payload as fallback
                if (payload?.responder?.lat && payload?.responder?.lng) {
                    setResponderPos({
                        lat: payload.responder.lat,
                        lng: payload.responder.lng
                    });
                }
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );

        // Responder: emit location every 3s
        if (!socket) return;
        const interval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(pos => {
                socket.emit("location:update", { lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [userRole, socket, payload]);

    // STEP 2 — Seeker position must come from SOS record, not hardcoded
    // When SOS is fetched, the seeker's lat/lng stored in the SOS document
    // is the real GPS they had when they triggered the SOS
    useEffect(() => {
        const fetchSOSDetails = async () => {
            try {
                const { data } = await api.get(`/sos/${effectiveSosId}`);
                // Use lat/lng stored on the SOS record itself
                // This was saved from seeker's real GPS at time of SOS creation
                if (data.lat && data.lng) {
                    setSeekerPos({ lat: data.lat, lng: data.lng });
                }
            } catch (err) {
                console.error("Failed to fetch SOS location details", err);
            }
        };
        if (effectiveSosId) fetchSOSDetails();
    }, [effectiveSosId]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typingUser]);

    const sendMessage = useCallback(() => {
        if (!inputValue.trim() || !socket) return;
        socket.emit("chat:message", { sosId: effectiveSosId, message: inputValue.trim() });
        setInputValue("");
    }, [inputValue, socket, effectiveSosId]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const handleTyping = () => {
        socket?.emit("chat:typing", { sosId: effectiveSosId });
    };

    const handleResolve = async () => {
        setResolving(true);
        try {
            await api.post(`/sos/${effectiveSosId}/resolve`);
            socket?.emit("sos:resolve", { sosId: effectiveSosId });
            setResolved(true);
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to resolve.");
        } finally {
            setResolving(false);
        }
    };

    const handleRatingSubmit = async () => {
        try {
            await api.post(`/ratings/${effectiveSosId}`, {
                stars: rating,
                review,
                responderId: responder.id || responder._id
            });
            setRatingSubmitted(true);
        } catch (e: any) {
            console.error(e);
            alert(e.response?.data?.message || "Failed to submit rating.");
        }
    };

    const typeConfig = TYPE_CONFIG[sosType] || TYPE_CONFIG["General Help"];
    const TypeIcon = typeConfig.icon;

    const distanceKm = (seekerPos?.lat && responderPos?.lat)
        ? haversineKm(seekerPos.lat, seekerPos.lng, responderPos.lat, responderPos.lng).toFixed(1)
        : null;
    const etaMin = distanceKm ? Math.ceil(parseFloat(distanceKm) / 30 * 60) : null;

    const formatResponseTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return m > 0 ? `${m} min ${sec} sec` : `${sec} sec`;
    };

    // Auto-close after resolution
    useEffect(() => {
        if (!resolved) return;

        // For responders: close automatically after showing the message
        // For seekers: wait until they submit a rating, then close
        if (userRole === "responder" || (userRole === "seeker" && ratingSubmitted)) {
            const timer = setTimeout(() => onClose(), 3000);
            return () => clearTimeout(timer);
        }
    }, [resolved, userRole, ratingSubmitted, onClose]);

    // ─── Resolution Screen ───────────────────────────────────────
    if (resolved) {
        return (
            <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden">
                {/* Map stays visible */}
                <div className="w-full lg:w-[60%] h-[40vh] lg:h-full relative">
                    <MutualMap
                        seekerPos={seekerPos}
                        responderPos={responderPos}
                        sosType={sosType}
                        responderName={responder.name}
                    />
                </div>
                {/* Resolution panel */}
                <div className="w-full lg:w-[40%] flex flex-col items-center justify-center bg-white border-l border-[#E5E5E5] p-8 text-center gap-4">
                    <CheckCircle className="w-16 h-16 text-[#34C759]" />
                    <h2 className="text-2xl font-bold text-[#161618]">Incident Resolved</h2>
                    {responseTime && (
                        <p className="text-[#A0A0A8] text-sm">Response time: {formatResponseTime(responseTime)}</p>
                    )}
                    {userRole === "seeker" && !ratingSubmitted && (
                        <div className="w-full">
                            <p className="text-sm font-semibold text-[#161618] mb-3">Rate {responder.name}'s response</p>
                            <div className="flex justify-center gap-1 mb-3">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <motion.button
                                        key={star}
                                        whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoveredStar(star)}
                                        onMouseLeave={() => setHoveredStar(0)}
                                    >
                                        <Star
                                            className={`w-8 h-8 transition-colors ${star <= (hoveredStar || rating) ? "text-[#FF9F0A] fill-[#FF9F0A]" : "text-[#E5E5E5]"}`}
                                        />
                                    </motion.button>
                                ))}
                            </div>
                            {rating > 0 && (
                                <>
                                    <textarea
                                        value={review}
                                        onChange={e => setReview(e.target.value)}
                                        placeholder="Leave a review (optional)..."
                                        className="w-full border border-[#E5E5E5] rounded-xl px-4 py-3 text-sm text-[#161618] focus:outline-none focus:border-[#161618] resize-none mb-3"
                                        rows={2}
                                    />
                                    <button onClick={handleRatingSubmit} className="w-full bg-[#161618] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-black">
                                        Submit Rating
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                    {ratingSubmitted && <p className="text-sm text-[#34C759] font-medium">Thank you for your feedback!</p>}
                    {userRole === "responder" && (
                        <div className="bg-[#F8F8FA] border border-[#E5E5E5] rounded-2xl p-4 text-sm text-[#555] text-left">
                            Thank you for responding. Your trust score has been updated.
                        </div>
                    )}
                    <button onClick={onClose} className="mt-2 bg-[#161618] text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-black">
                        {userRole === "responder" || (userRole === "seeker" && ratingSubmitted) ? "Returning to Dashboard..." : "Return to Dashboard"}
                    </button>
                </div>
            </div>
        );
    }

    // ─── Main View ───────────────────────────────────────────────
    return (
        <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden rounded-2xl border border-[#E5E5E5]">

            {/* ─── LEFT: Map Panel (60%) ─── */}
            <div className="relative w-full lg:w-[60%] h-[42vh] lg:h-full shrink-0">
                <MutualMap
                    seekerPos={seekerPos}
                    responderPos={responderPos}
                    sosType={sosType}
                    responderName={responder.name}
                />

                {/* Context info overlay */}
                <div className="absolute bottom-4 left-4 z-[400] bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-lg min-w-[190px] max-w-[230px]">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold mb-2 ${typeConfig.color} ${typeConfig.textColor}`}>
                        <TypeIcon className="w-3.5 h-3.5" />
                        {sosType}
                    </div>

                    {sosType === "Medical" && (modalData?.bloodGroup || seeker.bloodGroup) && (
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="bg-[#FF3B30]/10 text-[#FF3B30] rounded-lg px-2 py-0.5 text-xs font-bold">
                                {modalData?.bloodGroup || seeker.bloodGroup}
                            </span>
                        </div>
                    )}
                    {sosType === "Medical" && seeker.healthConditions && (
                        <p className="text-[10px] text-[#A0A0A8] mb-1 leading-snug">{seeker.healthConditions}</p>
                    )}
                    {sosType === "Car Problem" && (
                        <p className="text-[10px] text-[#555] mb-1">
                            {[modalData?.make, modalData?.model, modalData?.plate].filter(Boolean).join(" · ") || "Vehicle issue"}
                        </p>
                    )}

                    {distanceKm && (
                        <div className="mt-1 pt-1.5 border-t border-[#F0F0F0]">
                            <div className="flex items-center gap-1 text-[10px] text-[#555]">
                                <MapPin className="w-3 h-3" />
                                <span>{distanceKm} km apart</span>
                            </div>
                            {etaMin !== null && (
                                <p className="text-[10px] text-[#A0A0A8] mt-0.5">ETA: {etaMin === 0 ? '<1' : `~${etaMin}`} min</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── RIGHT: Chat Panel (40%) ─── */}
            <div className="w-full lg:w-[40%] flex flex-col bg-white border-t lg:border-t-0 lg:border-l border-[#E5E5E5] min-h-[50vh] lg:min-h-0">

                {/* Panel header */}
                <div className="px-5 py-4 border-b border-[#E5E5E5] bg-[#F8F8FA] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${typeConfig.color}`}>
                            <TypeIcon className={`w-4 h-4 ${typeConfig.textColor}`} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#161618]">Active Response</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse inline-block" />
                                <span className="text-[10px] text-[#A0A0A8] uppercase tracking-wider">Live</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {userRole === "seeker" && (
                            <button
                                onClick={handleResolve}
                                disabled={resolving}
                                className="bg-[#161618] text-white rounded-xl px-4 py-2 text-xs font-semibold hover:bg-black disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {resolving ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                Mark Resolved
                            </button>
                        )}
                        <button onClick={onClose} className="p-1.5 rounded-lg text-[#A0A0A8] hover:text-[#161618] hover:bg-[#F0F0F0]">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Info strip */}
                {userRole === "seeker" ? (
                    <div className="px-5 py-3 bg-[#F8F8FA] border-b border-[#E5E5E5] flex items-center gap-3 shrink-0">
                        <div className="w-8 h-8 rounded-full bg-[#161618] text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {responder.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#161618] truncate">{responder.name}</p>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                {(responder.skills || []).slice(0, 3).map((s: string) => (
                                    <span key={s} className="bg-[#F0F0F0] text-[#555] text-[10px] rounded-full px-2 py-0.5">{s}</span>
                                ))}
                                {responder.trustScore != null && (
                                    <span className="flex items-center gap-0.5 text-[10px] text-[#A0A0A8]">
                                        <Star className="w-2.5 h-2.5" /> {responder.trustScore}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="px-5 py-3 bg-[#F8F8FA] border-b border-[#E5E5E5] flex items-center gap-3 shrink-0">
                        <div className="w-8 h-8 rounded-full bg-[#FF3B30] text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {seeker.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#161618] truncate">{seeker.name}</p>
                            {sosType === "Medical" && seeker.bloodGroup && (
                                <span className="bg-[#FF3B30]/10 text-[#FF3B30] text-[10px] font-bold rounded-lg px-2 py-0.5 mt-0.5 inline-block">
                                    Blood: {seeker.bloodGroup}
                                </span>
                            )}
                            {seeker.healthConditions && (
                                <p className="text-[10px] text-[#A0A0A8] mt-0.5 truncate">{seeker.healthConditions}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {messages.map((msg, i) => {
                        if (msg.system) return (
                            <div key={i} className="text-center text-xs text-[#A0A0A8] py-1">{msg.message}</div>
                        );

                        const isMe = msg.senderId === (currentUser?.id || currentUser?._id);
                        return (
                            <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className="max-w-[80%]">
                                    {!isMe && (
                                        <p className="text-[10px] text-[#A0A0A8] mb-1 ml-1">{msg.senderName}</p>
                                    )}
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-[#161618] text-white rounded-br-sm" : "bg-[#F0F0F0] text-[#161618] rounded-bl-sm"}`}>
                                        <p className="whitespace-pre-line">{msg.message}</p>
                                        <p className={`text-[10px] mt-1 ${isMe ? "text-white/50 text-right" : "text-[#A0A0A8] text-left"}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Typing indicator */}
                    {typingUser && (
                        <div className="flex justify-start items-center gap-1 px-2 py-1">
                            <p className="text-[10px] text-[#A0A0A8] mr-1">{typingUser}</p>
                            {[0, 150, 300].map(delay => (
                                <motion.span
                                    key={delay}
                                    className="w-2 h-2 rounded-full bg-[#A0A0A8] inline-block"
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.6, delay: delay / 1000 }}
                                />
                            ))}
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input bar */}
                <div className="px-4 py-4 border-t border-[#E5E5E5] bg-white flex items-center gap-3 shrink-0">
                    <input
                        value={inputValue}
                        onChange={e => { setInputValue(e.target.value); handleTyping(); }}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1 bg-[#F8F8FA] border border-[#E5E5E5] rounded-2xl px-4 py-3 text-sm text-[#161618] outline-none focus:border-[#161618] focus:ring-1 focus:ring-[#161618]"
                    />
                    <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={sendMessage}
                        className="bg-[#161618] text-white rounded-2xl w-11 h-11 flex items-center justify-center shrink-0 hover:bg-[#2a2a2e]"
                    >
                        <Send className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
