"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Users, Zap } from "lucide-react";

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "Anonymous SOS" },
  { icon: Users, label: "Community Verified" },
  { icon: Zap, label: "< 30s Response" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: "easeOut" },
  }),
};

export default function HeroSection() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [pressed, setPressed] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setTilt({ x: (e.clientX - cx) * 0.25, y: (e.clientY - cy) * 0.25 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 bg-white overflow-hidden pt-16"
    >
      {/* Subtle background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(22,22,24,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(22,22,24,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-6">
        {/* Eyebrow pill */}


        {/* Headline */}
        <motion.h1
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-6xl md:text-8xl font-bold text-[#161618] leading-tight text-balance"
        >
          Help is always{" "}
          <span className="font-normal">nearby</span>
          <span
            className="font-bold relative inline-block"
            aria-hidden="true"
            style={{ display: "none" }}
          />
          {"."}
        </motion.h1>

        {/* Subline */}
        <motion.p
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-lg text-[#555] max-w-xl mx-auto mt-4 leading-relaxed"
        >
          When seconds matter, your neighbours are faster than 911. AetherNet
          activates the people around you instantly.
        </motion.p>

        {/* CTA Button — magnetic */}
        <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
          <Link href="/auth/signup" passHref>
            <motion.button
              ref={btnRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onMouseDown={() => setPressed(true)}
              onMouseUp={() => setPressed(false)}
              animate={{
                x: tilt.x,
                y: tilt.y,
                scale: pressed ? 0.95 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-[#161618] text-white text-base font-semibold px-8 py-3.5 rounded-full shadow-lg hover:bg-[#2a2a2e] transition-colors duration-150 select-none cursor-pointer"
            >
              Get Started — It&apos;s Free
            </motion.button>
          </Link>
        </motion.div>



        {/* Trust Strip */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-center justify-center gap-6 mt-2 flex-wrap"
        >
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[#A0A0A8] text-xs">
              <Icon size={14} />
              <span>{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}

    </section>
  );
}
