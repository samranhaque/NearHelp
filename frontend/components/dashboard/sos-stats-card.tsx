"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { getSocket } from "../../lib/socket";

function CountUp({ target, duration = 800 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);

  return <>{value}</>;
}

export default function SosStatsCard() {
  const { user } = useAuth();
  const [stats, setStats] = useState([
    { target: 0, label: "Total SOS", color: "#000000ff" },
    { target: 0, label: "Resolved Today", color: "#000000ff" },
    { target: 0, label: "Avg. Response", color: "#000000ff", suffix: "s" },
    { target: 0, label: "Medical SOS", color: "#000000ff" },
  ]);

  useEffect(() => {
    if (!user) return; // Allow any user

    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/sos/global-stats');
        setStats([
          { target: data.totalSOS || 0, label: "Total SOS", color: "#000000ff" },
          { target: data.resolvedToday || 0, label: "Resolved Today", color: "#000000ff" },
          { target: Math.round(data.avgResponseTimeByType?.Medical || 0), label: "Med Avg Response", color: "#000000ff", suffix: "s" },
          { target: data.sosByType?.Medical || 0, label: "Medical SOS", color: "#000000ff" }
        ]);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAnalytics();

    // Listen for live updates
    const socket = getSocket();
    if (socket) {
      socket.on('sos:stats_updated', fetchAnalytics);
    }
    return () => {
      if (socket) socket.off('sos:stats_updated', fetchAnalytics);
    };
  }, [user]);

  return (
    <div className="h-full rounded-3xl border border-[#E5E5E5] bg-[#FFFFFF] p-6 text-black">
      <h2 className="text-base font-semibold text-black">Today's Activity</h2>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {stats.map(({ target, label, color, suffix }) => (
          <div
            key={label}
            className="flex flex-col gap-1 rounded-2xl bg-[#F7F7F8] p-4"
          >
            <span
              className="text-3xl font-bold leading-none"
              style={{ color }}
            >
              <CountUp target={target} />
              {suffix ?? ""}
            </span>
            <span className="text-xs text-[#A0A0A8]">{label}</span>

          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-sm font-medium text-[#A0A0A8] ">
        Great, Much less friction today.
      </p>
    </div>
  );
}
