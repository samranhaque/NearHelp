"use client";

import { useState } from "react";
import { X, ShieldCheck, Flame, Truck, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EmergencyModal({ onClose }: { onClose: () => void }) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 z-[500] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-3xl p-8 w-full max-w-sm border border-[#E5E5E5] shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-[#161618]">Emergency Services</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-[#F7F7F8] transition-colors">
                            <X className="w-5 h-5 text-[#161618]" />
                        </button>
                    </div>
                    <p className="text-sm text-[#A0A0A8] text-center mb-6">Tap to call — opens your phone dialer</p>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => { window.location.href = 'tel:100'; }}
                            className="bg-[#161618] text-white rounded-2xl p-5 flex items-center gap-4 w-full hover:bg-[#2a2a2e] transition-colors cursor-pointer"
                        >
                            <ShieldCheck className="w-8 h-8 shrink-0" />
                            <div className="text-left">
                                <p className="font-bold text-lg leading-tight">Police</p>
                                <p className="text-[#A0A0A8] text-sm">100</p>
                            </div>
                        </button>

                        <button
                            onClick={() => { window.location.href = 'tel:101'; }}
                            className="bg-[#FF3B30] text-white rounded-2xl p-5 flex items-center gap-4 w-full hover:bg-[#CC2A20] transition-colors cursor-pointer"
                        >
                            <Flame className="w-8 h-8 shrink-0" />
                            <div className="text-left">
                                <p className="font-bold text-lg leading-tight">Fire Brigade</p>
                                <p className="text-white/70 text-sm">101</p>
                            </div>
                        </button>

                        <button
                            onClick={() => { window.location.href = 'tel:108'; }}
                            className="bg-[#34C759] text-white rounded-2xl p-5 flex items-center gap-4 w-full hover:bg-[#28A347] transition-colors cursor-pointer"
                        >
                            <Truck className="w-8 h-8 shrink-0" />
                            <div className="text-left">
                                <p className="font-bold text-lg leading-tight">Ambulance</p>
                                <p className="text-white/70 text-sm">108</p>
                            </div>
                        </button>
                    </div>

                    <button
                        onClick={() => { window.location.href = 'tel:112'; }}
                        className="mt-6 w-full text-center text-sm font-semibold text-[#FF3B30] hover:underline"
                    >
                        National Emergency: 112
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
