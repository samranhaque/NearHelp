"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

function TrustBar({ score }: { score: number }) {
  const filled = Math.round(score);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 w-3 rounded-full"
          style={{ backgroundColor: i < filled ? "#161618" : "#E5E5E5" }}
        />
      ))}
      <span className="ml-1 text-xs font-medium text-[#161618]">{score}</span>
    </div>
  );
}

function SkillBadge({ skill, primary }: { skill: string; primary?: boolean }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none"
      style={
        primary
          ? { backgroundColor: "#161618", color: "#ffffff" }
          : { backgroundColor: "#F0F0F0", color: "#161618" }
      }
    >
      {skill}
    </span>
  );
}

export default function SkillRegistryCard() {
  const { user } = useAuth();
  const [responders, setResponders] = useState<any[]>([]);

  useEffect(() => {
    // Supabase stores lat/lng flat on user, not nested in user.location
    const lat = user?.lat ?? user?.location?.lat;
    const lng = user?.lng ?? user?.location?.lng;
    if (!user || !lat) return;

    const fetchNearby = async () => {
      try {
        const { data } = await api.get(`/users/nearby?lat=${lat}&lng=${lng}&radius=5`);
        setResponders(data);
      } catch (err) {
        console.error("Failed to fetch nearby users:", err);
      }
    };
    fetchNearby();
  }, [user]);

  return (
    <div id="skills" className="h-full rounded-3xl border border-[#E5E5E5] bg-white p-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-[#161618]">Nearby Skill Registry</h2>
        <p className="text-xs text-[#A0A0A8] mt-0.5">Verified responders in 5km radius</p>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F0F0F0]">
              {["Responder", "Skills", "Distance", "Trust Score", "Status"].map((col) => (
                <th
                  key={col}
                  className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#A0A0A8]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F8F8F8]">
            {responders.map((r) => {
              const statusColor = r.isOnline ? "#34C759" : "#A0A0A8";
              const statusText = r.isOnline ? "Online" : "Offline";
              // Calculate Haversine mock string or display distance if routing engine returned it
              // The API getNearbyUsers actually maps Euclidean or Haversine distance, let's just use a string
              const distString = r.distance ? `${r.distance.toFixed(1)}km` : "< 5km";

              return (
                <tr key={r.id || r._id} className="group transition-colors hover:bg-[#F8F8FA]">
                  {/* Responder */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#161618]">
                        <span className="text-[10px] font-bold text-white">
                          {r.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-semibold text-[#161618]">{r.name}</span>
                    </div>
                  </td>

                  {/* Skills */}
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {r.skills.map((s: string, i: number) => (
                        <SkillBadge key={s} skill={s} primary={i === 0} />
                      ))}
                    </div>
                  </td>

                  {/* Distance */}
                  <td className="py-3 pr-4 text-sm text-[#161618]">{distString}</td>

                  {/* Trust */}
                  <td className="py-3 pr-4">
                    <TrustBar score={r.trustScore || 0.0} />
                  </td>

                  {/* Status */}
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: statusColor }}
                      />
                      <span className="text-xs font-medium" style={{ color: statusColor }}>
                        {statusText}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
