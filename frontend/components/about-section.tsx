"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, Heart, Car } from "lucide-react";

const INCIDENTS = [
  {
    icon: AlertTriangle,
    iconColor: "text-red-500",
    title: "Gas Leak – Sector 4",
    badge: "2 Responders Nearby",
    time: "Just now",
  },
  {
    icon: Heart,
    iconColor: "text-blue-400",
    title: "Medical – Sector 7",
    badge: "4 Responders Nearby",
    time: "1 min ago",
  },
  {
    icon: Car,
    iconColor: "text-yellow-400",
    title: "Car Breakdown – NH-8",
    badge: "1 Responder Nearby",
    time: "3 min ago",
  },
];

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, delay, ease: "easeOut" } },
});

export default function AboutSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="about" ref={ref} className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeUp(0)}
          className="flex flex-col gap-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#161618] leading-tight text-balance">
            Most emergencies are resolved before ambulances arrive.
          </h2>
          <p className="text-[#555] text-lg leading-relaxed">
            AetherNet turns neighbours, bystanders, and skilled community members
            into a first-response layer. By activating the people already around
            you, we bridge the critical gap between when something happens and
            when official services arrive.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-8 flex-wrap">
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold text-[#161618]">50m</span>
              <span className="text-sm text-[#A0A0A8]">avg. response time</span>
            </div>
            <div className="w-px h-10 bg-[#E5E5E5]" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold text-[#161618]">3×</span>
              <span className="text-sm text-[#A0A0A8]">
                faster than traditional services
              </span>
            </div>
          </div>
        </motion.div>

        {/* Right — dark incident feed card */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeUp(0.15)}
          className="bg-[#161618] rounded-3xl p-8 text-white"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-[#A0A0A8] uppercase tracking-widest mb-1">
                Live
              </p>
              <h3 className="text-lg font-semibold">Active Incidents</h3>
            </div>
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-xs text-[#A0A0A8]">3 open</span>
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {INCIDENTS.map(({ icon: Icon, iconColor, title, badge, time }) => (
              <div
                key={title}
                className="flex items-center justify-between gap-4 bg-white/5 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={iconColor} aria-hidden="true" />
                  <span className="text-sm font-medium text-white">{title}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className="text-[11px] font-semibold text-[#22c55e]">
                    {badge}
                  </span>
                  <span className="text-[10px] text-[#666]">{time}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-[#555] mt-5 text-center">
            Showing incidents within your 5km community radius
          </p>
        </motion.div>
      </div>
    </section>
  );
}
