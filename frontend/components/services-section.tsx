"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Radio, Bot, BadgeCheck } from "lucide-react";

const SERVICES = [
  {
    icon: Radio,
    title: "SOS Broadcasting",
    description:
      "Tap once to alert verified community members within 5km. Smart routing ensures the right people receive your call based on skill and proximity.",
  },
  {
    icon: Bot,
    title: "AI Crisis Assistant",
    description:
      "Receive immediate, situation-specific first-response guidance the moment your SOS is triggered. No waiting, no searching.",
  },
  {
    icon: BadgeCheck,
    title: "Skill-Based Routing",
    description:
      "Doctors, mechanics, and trained responders in your area are auto-prioritised. The right help finds you — not just the closest person.",
  },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardAnim = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function ServicesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="services"
      ref={ref}
      className="py-24 px-6 bg-[#F7F7F8]"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="text-xs text-[#A0A0A8] uppercase tracking-widest font-medium">
            What we do
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#161618] mt-3 text-balance">
            Built for the moments that matter.
          </h2>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {SERVICES.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={cardAnim}
              className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col gap-4"
            >
              <div className="w-11 h-11 bg-[#161618] rounded-xl flex items-center justify-center shrink-0">
                <Icon size={20} className="text-white" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#161618] mb-2">
                  {title}
                </h3>
                <p className="text-[#666] text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
