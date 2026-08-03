"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { useAuth } from "../../context/AuthContext";
import { AlertTriangle, Car, Flame, ShieldAlert, HeartPulse, Baby, Zap, Building2, PawPrint, Waves, Scale, Utensils, Users, Wind, X, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const typeConfig: any = {
  "Medical": { color: "#FF3B30", icon: HeartPulse },
  "Mental Health Crisis": { color: "#8B5CF6", icon: Users },
  "Elderly Care": { color: "#F43F5E", icon: HeartPulse },
  "Car Problem": { color: "#FF9F0A", icon: Car },
  "Fire": { color: "#F97316", icon: Flame },
  "Gas Leak": { color: "#EAB308", icon: Wind },
  "Electrical": { color: "#FACC15", icon: Zap },
  "Flood / Water": { color: "#3B82F6", icon: Waves },
  "Structural Collapse": { color: "#78716C", icon: Building2 },
  "Pet Rescue": { color: "#84CC16", icon: PawPrint },
  "Child in Danger": { color: "#EC4899", icon: Baby },
  "Threat to Safety": { color: "#7C3AED", icon: ShieldAlert },
  "Legal Emergency": { color: "#6366F1", icon: Scale },
  "Food / Shelter": { color: "#22C55E", icon: Utensils },
  "General Help": { color: "#6B7280", icon: AlertTriangle },
};

export default function SosFeedCard({ onRespond }: { onRespond?: (sos: any) => void }) {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);

  const [isAccepting, setIsAccepting] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const fetchSOS = async () => {
    try {
      if (user?.email === 'municipal@community.gov.in') {
        const { data } = await api.get('/admin/live-map');
        setIncidents(data.activeSOS);
      } else {
        const { data } = await api.get('/sos/active');
        setIncidents(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchSOS();

    const socket = getSocket();
    if (socket) {
      socket.on('sos:new', fetchSOS);
      socket.on('sos:update', fetchSOS);
      socket.on('sos:resolved', fetchSOS);
      socket.on('sos:new_alert', fetchSOS);
      socket.on('sos:priority_alert', fetchSOS);

      if (user.email === 'municipal@community.gov.in') {
        socket.on('admin:sos_created', fetchSOS);
        socket.on('admin:sos_updated', fetchSOS);
        socket.on('admin:sos_resolved', fetchSOS);
        socket.on('admin:current_state', (data: any) => setIncidents(data.activeSOS));
      }
    }

    return () => {
      if (socket) {
        socket.off('sos:new', fetchSOS);
        socket.off('sos:update', fetchSOS);
        socket.off('sos:resolved', fetchSOS);
        socket.off('sos:new_alert', fetchSOS);
        socket.off('sos:priority_alert', fetchSOS);
        socket.off('admin:sos_created', fetchSOS);
        socket.off('admin:sos_updated', fetchSOS);
        socket.off('admin:sos_resolved', fetchSOS);
        socket.off('admin:current_state');
      }
    };
  }, [user]);

  const handleDecline = (sosId: string) => {
    // Just hide this card locally — no API call needed
    setDismissed(prev => [...prev, sosId]);
  };

  const handleAccept = async (sosId: string) => {
    setIsAccepting(true);
    try {
      // Call presence confirmation endpoint
      await api.post(`/sos/${sosId}/presence`, { available: true });
      // Map opens automatically when server emits 'response:mutual_open'
      // Do not navigate manually — wait for socket event
    } catch (err) {
      console.error('Accept failed:', err);
    } finally {
      setIsAccepting(false);
    }
  };

  // Filter out locally declined cards from the rendered list
  const visibleSOS = incidents.filter(s => !dismissed.includes(s.id || s._id));

  // Increased minRows to 8 to provide more empty stacks/lines
  const minRows = 8;
  const displayRows = Math.max(visibleSOS.length, minRows);

  return (
    <div id="sos-feed" className="flex flex-col h-full rounded-3xl border border-[#E5E5E5] bg-white p-6">
      {/* Title row */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold text-[#161618]">Active Incidents</h2>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF3B30] text-[10px] font-bold text-white">
          {visibleSOS.length}
        </span>
      </div>

      {/* Lined Feed Container - Scrollbar stylized to blend with background */}
      <div
        className="flex-1 overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:#f3f4f6_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full"
        style={{ maxHeight: '190px' }}
      >
        <ul className="flex flex-col w-full border-t border-[#F0F0F0]">
          {Array.from({ length: displayRows }).map((_, index) => {
            const sos = visibleSOS[index];

            // 1. Render Active Incident Row
            if (sos) {
              const conf = typeConfig[sos.type] || typeConfig["General Help"];
              const Icon = conf.icon;

              return (
                <motion.li
                  key={sos.id || sos._id || index}
                  whileHover={{ x: 4 }}
                  className="flex flex-col border-b border-[#F0F0F0] py-4"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: conf.color + "18" }}
                    >
                      <Icon className="h-4 w-4" style={{ color: conf.color }} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#161618] truncate">{sos.type}</p>
                      <p className="text-xs text-[#A0A0A8]">{sos.status}</p>
                    </div>
                  </div>

                  {/* Only show Accept/Decline if current user is NOT the seeker and no one has responded yet */}
                  {sos.seeker_id !== user.id && sos.status === 'active' && !(sos.responders?.length > 0) && (
                    <div className="flex gap-2 mt-3">

                      {/* DECLINE button */}
                      <button
                        onClick={() => handleDecline(sos.id || sos._id)}
                        className="flex-1 bg-[#F8F8FA] border border-[#E5E5E5] 
                                   text-[#161618] rounded-xl py-2.5 text-sm font-medium
                                   hover:bg-[#F0F0F0] transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Decline
                      </button>

                      {/* ACCEPT button */}
                      <button
                        onClick={() => handleAccept(sos.id || sos._id)}
                        disabled={isAccepting}
                        className="flex-[2] bg-[#161618] text-white rounded-xl py-2.5 
                                   px-5 text-sm font-semibold hover:bg-[#2a2a2e] transition-colors
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   flex items-center justify-center gap-2"
                      >
                        {isAccepting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 
                                            border-t-white rounded-full animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Accept & Respond
                          </>
                        )}
                      </button>

                    </div>
                  )}

                  {/* Show "Your SOS" badge if current user is the seeker */}
                  {sos.seeker_id === user.id && (
                    <div className="mt-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 
                                    rounded-xl py-2 px-3 text-center">
                      <span className="text-[#FF3B30] text-xs font-semibold">
                        Your Active SOS
                      </span>
                    </div>
                  )}

                  {/* Show "Responding" badge if already accepted */}
                  {sos.responders?.includes(user.id) && (
                    <div className="mt-3 bg-[#34C759]/10 border border-[#34C759]/20 
                                    rounded-xl py-2 px-3 text-center">
                      <span className="text-[#34C759] text-xs font-semibold flex 
                                       items-center justify-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        You are responding
                      </span>
                    </div>
                  )}
                </motion.li>
              );
            }

            // 2. Render Empty Lined Rows (to maintain the grid aesthetic)
            return (
              <li
                key={`empty-${index}`}
                className="flex h-[60px] border-b border-[#F0F0F0] w-full items-center"
              >
              </li>
            );
          })}

        </ul>
      </div>
    </div>
  );
}
