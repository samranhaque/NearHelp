"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket";
import { MessageSquareHeart, X } from "lucide-react";

export default function DebriefBanner() {
    const [debrief, setDebrief] = useState<string | null>(null);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;
        const handler = ({ debrief: d }: any) => {
            if (d) setDebrief(d);
        };
        socket.on('sos:debrief_ready', handler);
        return () => { socket.off('sos:debrief_ready', handler); };
    }, []);

    return (
        <AnimatePresence>
            {debrief && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-[250] w-full max-w-lg px-4"
                >
                    <div className="bg-[#161618] border border-[#2a2a2e] rounded-2xl p-5 shadow-2xl">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-violet-500/15 flex items-center justify-center rounded-full shrink-0">
                                    <MessageSquareHeart className="h-4 w-4 text-violet-400" />
                                </div>
                                <p className="text-sm font-bold text-white">Post-Incident Check-In</p>
                            </div>
                            <button onClick={() => setDebrief(null)} className="text-[#A0A0A8] hover:text-white transition-colors shrink-0">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-sm text-[#A0A0A8] whitespace-pre-line leading-relaxed">{debrief}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
