"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    q: "Who can see my SOS alert?",
    a: "Only verified users within a 5km radius. Threat-based SOS is anonymised.",
  },
  {
    q: "Do I need to share my real location?",
    a: "AetherNet uses a community map without exposing your precise GPS to responders.",
  },
  {
    q: "What happens if someone sends a fake SOS?",
    a: "Responders can flag false alerts. Repeat offenders are automatically suspended.",
  },
  {
    q: "Can I pre-assign family members as Guardians?",
    a: "Yes. Guardians are notified instantly before the wider community broadcast.",
  },
  {
    q: "What skill types can I register?",
    a: "Medical (doctor, nurse, CPR trained), mechanical, and general first-aid skills.",
  },
  {
    q: "Is AetherNet free to use?",
    a: "Yes, AetherNet is entirely free for individuals. Community trust is our currency.",
  },
];

export default function FaqsSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section id="faqs" ref={ref} className="py-24 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="text-xs text-[#A0A0A8] uppercase tracking-widest font-medium">
            FAQs
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#161618] mt-3 text-balance">
            Common questions answered.
          </h2>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex flex-col divide-y divide-[#E5E5E5] border border-[#E5E5E5] rounded-2xl overflow-hidden"
        >
          {FAQS.map(({ q, a }, i) => (
            <div key={q}>
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white hover:bg-[#F7F7F8] transition-colors duration-150"
                aria-expanded={openIndex === i}
              >
                <span className="text-sm font-semibold text-[#161618] leading-snug">
                  {q}
                </span>
                <span className="shrink-0 text-[#A0A0A8]">
                  {openIndex === i ? <Minus size={16} /> : <Plus size={16} />}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm text-[#666] leading-relaxed">
                      {a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
