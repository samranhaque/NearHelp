"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Heart, Flame, Car, Wind, Zap, Building2, Baby, PawPrint,
    Utensils, ShieldAlert, Scale, Waves, Users, HelpCircle,
    MapPin, BadgeCheck, CheckCircle, X
} from "lucide-react";
import api from "../../lib/api";

const TYPE_CONFIG: Record<string, { icon: any; color: string; bgColor: string; borderColor: string }> = {
    Medical: { icon: Heart, color: "text-[#FF3B30]", bgColor: "bg-[#FF3B30]/10", borderColor: "border-[#FF3B30]/30" },
    Fire: { icon: Flame, color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
    "Car Problem": { icon: Car, color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
    "Gas Leak": { icon: Wind, color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" },
    Electrical: { icon: Zap, color: "text-yellow-500", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" },
    "Structural Collapse": { icon: Building2, color: "text-stone-600", bgColor: "bg-stone-50", borderColor: "border-stone-200" },
    "Child in Danger": { icon: Baby, color: "text-pink-600", bgColor: "bg-pink-50", borderColor: "border-pink-200" },
    "Pet Rescue": { icon: PawPrint, color: "text-lime-600", bgColor: "bg-lime-50", borderColor: "border-lime-200" },
    "Food / Shelter": { icon: Utensils, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" },
    "Threat to Safety": { icon: ShieldAlert, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
    "Legal Emergency": { icon: Scale, color: "text-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-indigo-200" },
    "Flood / Water": { icon: Waves, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
    "Mental Health Crisis": { icon: Users, color: "text-violet-600", bgColor: "bg-violet-50", borderColor: "border-violet-200" },
    "Elderly Care": { icon: Heart, color: "text-rose-600", bgColor: "bg-rose-50", borderColor: "border-rose-200" },
    "General Help": { icon: HelpCircle, color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface NotificationData {
    sos: any;
    isPriority?: boolean;
    isGuardian?: boolean;
}

interface PresenceNotificationProps {
    data: NotificationData;
    userLocation: { lat: number; lng: number } | null;
    onDismiss: () => void;
    onConfirm: () => Promise<void>;
}

const AUTO_DISMISS_SECONDS = 30;

export function PresenceNotificationCard({ data, userLocation, onDismiss, onConfirm }: PresenceNotificationProps) {
    const [isConfirming, setIsConfirming] = useState(false);
    const [timeLeft, setTimeLeft] = useState(AUTO_DISMISS_SECONDS);

    const sos = data.sos || data;
    const sosType = sos?.type || "General Help";
    const config = TYPE_CONFIG[sosType] || TYPE_CONFIG["General Help"];
    const Icon = config.icon;

    const sosLat = sos?.lat ?? sos?.location?.lat;
    const sosLng = sos?.lng ?? sos?.location?.lng;
    const distanceKm = (userLocation && sosLat && sosLng)
        ? haversineKm(userLocation.lat, userLocation.lng, sosLat, sosLng).toFixed(1)
        : null;

    useEffect(() => {
        if (timeLeft <= 0) { onDismiss(); return; }
        const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
        return () => clearTimeout(t);
    }, [timeLeft, onDismiss]);

    const handleYes = async () => {
        setIsConfirming(true);
        try { await onConfirm(); }
        catch (e) { console.error(e); }
        finally { setIsConfirming(false); }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 border border-[#E5E5E5] shadow-2xl relative overflow-hidden"
        >
            {/* Type pill */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.borderColor} ${config.color} mx-auto flex`}>
                <Icon className="w-4 h-4" />
                <span className="text-xs font-bold">{sosType}</span>
            </div>

            {/* Main message */}
            <h2 className="text-xl font-bold text-[#161618] mt-4 text-center">Someone nearby needs help</h2>
            <p className="text-sm text-[#A0A0A8] text-center mt-2">
                You are within response distance. Are you available to help?
            </p>

            {/* Distance */}
            {distanceKm && (
                <div className="flex justify-center mt-3">
                    <span className="inline-flex items-center gap-1.5 bg-[#F8F8FA] border border-[#E5E5E5] rounded-full px-3 py-1 text-xs text-[#555]">
                        <MapPin className="w-3 h-3" />
                        {distanceKm} km away
                    </span>
                </div>
            )}

            {/* Priority skill match badge */}
            {data.isPriority && (
                <div className="mt-3 bg-[#FF3B30]/5 border border-[#FF3B30]/20 rounded-xl p-3 text-center flex items-center justify-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-[#FF3B30]" />
                    <span className="text-sm text-[#FF3B30] font-medium">Your skills match this emergency</span>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-6">
                {/* NO button */}
                <button
                    onClick={onDismiss}
                    className="flex-1 bg-[#F8F8FA] border border-[#E5E5E5] text-[#161618] rounded-2xl py-4 text-sm font-semibold hover:bg-[#F0F0F0] transition-colors flex items-center justify-center gap-2"
                >
                    <X className="w-4 h-4" />
                    Not Available
                </button>

                {/* YES button */}
                <button
                    onClick={handleYes}
                    disabled={isConfirming}
                    className="flex-1 bg-[#161618] text-white rounded-2xl py-4 text-sm font-semibold hover:bg-[#2a2a2e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {isConfirming ? (
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <><CheckCircle className="w-4 h-4" /> Accept — I am Here</>
                    )}
                </button>
            </div>

            {/* Auto-dismiss countdown bar */}
            <div className="mt-5 bg-[#E5E5E5] rounded-full h-1 w-full overflow-hidden">
                <motion.div
                    className="bg-[#161618] h-1 rounded-full origin-left"
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: timeLeft / AUTO_DISMISS_SECONDS }}
                    transition={{ ease: "linear", duration: 0.9 }}
                />
            </div>
            <p className="text-center text-[10px] text-[#A0A0A8] mt-1">Auto-dismissing in {timeLeft}s</p>
        </motion.div>
    );
}

// Queue wrapper — renders one at a time
interface QueueProps {
    queue: NotificationData[];
    userLocation: { lat: number; lng: number } | null;
    onDismiss: (item: NotificationData) => void;
    onConfirm: (item: NotificationData) => Promise<void>;
}

export function PresenceNotificationQueue({ queue, userLocation, onDismiss, onConfirm }: QueueProps) {
    const active = queue[0] ?? null;

    return (
        <AnimatePresence>
            {active && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <PresenceNotificationCard
                        data={active}
                        userLocation={userLocation}
                        onDismiss={() => onDismiss(active)}
                        onConfirm={() => onConfirm(active)}
                    />
                </div>
            )}
        </AnimatePresence>
    );
}
