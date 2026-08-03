"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface SOSAlert {
    id: string;
    sos: {
        id: string;
        type: string;
        lat: number;
        lng: number;
        is_anonymous?: boolean;
        seekerName?: string;
        anonymous_name?: string;
    };
    isPriority: boolean;
    isAnonymous?: boolean;
    isGuardian?: boolean;
    seekerName?: string;
}

interface Props {
    socket: any;
    onRespond?: (sos: any) => void;
}

export default function NotificationBanner({ socket, onRespond }: Props) {
    const { user } = useAuth();
    const [alerts, setAlerts] = useState<SOSAlert[]>([]);

    useEffect(() => {
        if (!socket) return;

        // Request browser notification permission
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const addAlert = (data: any, isPriority: boolean, isGuardian = false) => {
            // Never notify the person who triggered the SOS
            if (user && (data.sos?.seeker_id === user.id || data.sos?.seeker_id === user._id)) return;

            const alert: SOSAlert = {
                id: `${Date.now()}-${Math.random()}`,
                sos: data.sos,
                isPriority,
                isAnonymous: data.isAnonymous,
                isGuardian,
                seekerName: data.seekerName || data.sos?.seekerName || 'Unknown',
            };

            setAlerts(prev => [alert, ...prev].slice(0, 5));

            // Browser notification
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification(
                    isPriority ? 'Priority SOS Alert — Skills Matched' : isGuardian ? 'Guardian SOS Alert' : 'SOS Alert Nearby',
                    { body: `${data.sos?.type || 'Emergency'} — ${alert.seekerName}` }
                );
            }

            // Auto-dismiss after 30s
            setTimeout(() => {
                setAlerts(prev => prev.filter(a => a.id !== alert.id));
            }, 30000);
        };

        socket.on('sos:priority_alert', (data: any) => addAlert(data, true));
        socket.on('sos:new_alert', (data: any) => addAlert(data, false));
        socket.on('sos:guardian_alert', (data: any) => addAlert(data, false, true));

        return () => {
            socket.off('sos:priority_alert');
            socket.off('sos:new_alert');
            socket.off('sos:guardian_alert');
        };
    }, [socket]);

    const dismiss = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id));

    return (
        <div className="fixed top-6 right-6 z-[300] flex flex-col gap-3 w-80">
            <AnimatePresence>
                {alerts.map(alert => (
                    <motion.div
                        key={alert.id}
                        initial={{ x: 320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 320, opacity: 0 }}
                        className={`relative bg-white rounded-2xl shadow-2xl border-2 p-4 ${alert.isPriority
                            ? 'border-[#FF3B30] animate-pulse'
                            : alert.isGuardian
                                ? 'border-[#FF9F0A]'
                                : 'border-[#E5E5E5]'
                            }`}
                    >
                        <button
                            onClick={() => dismiss(alert.id)}
                            className="absolute top-3 right-3 p-1 rounded-full hover:bg-[#F7F7F8]"
                        >
                            <X className="w-3.5 h-3.5 text-[#A0A0A8]" />
                        </button>

                        <div className="flex items-start gap-3 pr-6">
                            <div className={`p-2 rounded-xl ${alert.isPriority ? 'bg-[#FF3B30]' : alert.isGuardian ? 'bg-[#FF9F0A]' : 'bg-[#161618]'}`}>
                                <AlertTriangle className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-[#FF3B30] uppercase tracking-wider mb-0.5">
                                    {alert.isGuardian ? 'Guardian Alert' : alert.isPriority ? 'Priority — Skills Matched' : 'SOS Nearby'}
                                </p>
                                <p className="text-sm font-semibold text-[#161618] truncate">
                                    {alert.sos?.type || 'Emergency'}
                                </p>
                                <p className="text-xs text-[#A0A0A8] mt-0.5">
                                    {alert.isAnonymous ? 'Anonymous User' : alert.seekerName}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 space-y-2">
                            <p className="text-[11px] font-bold text-[#161618] px-1">Are you present?</p>
                            {onRespond && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { onRespond(alert.sos); dismiss(alert.id); }}
                                        className="flex-1 bg-[#161618] text-white text-[11px] font-bold rounded-xl px-4 py-2.5 hover:bg-black transition-all active:scale-95"
                                    >
                                        Yes
                                    </button>
                                    <button
                                        onClick={() => dismiss(alert.id)}
                                        className="flex-1 bg-gray-100 text-[#161618] text-[11px] font-bold rounded-xl px-4 py-2.5 hover:bg-gray-200 transition-all active:scale-95"
                                    >
                                        No
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
