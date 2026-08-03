"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ShieldAlert, Github, Twitter } from "lucide-react";
import Link from "next/link";

export function CtaBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="py-24 px-6 bg-[#161618]"
    >
      <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="text-4xl md:text-5xl font-bold text-white text-balance"
        >
          Ready to help your community?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="text-[#A0A0A8] text-lg leading-relaxed max-w-md"
        >
          Join thousands of verified responders. Sign up in under 60 seconds.
        </motion.p>

        <Link href="/auth/signup" passHref>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.2 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="bg-white text-[#161618] text-base font-semibold px-8 py-3.5 rounded-full shadow-lg hover:bg-[#F0F0F0] transition-colors duration-150 select-none cursor-pointer"
          >
            Join AetherNet
          </motion.button>
        </Link>
      </div>
    </section>
  );
}

export function Footer() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-[#161618] border-t border-white/10 px-6 py-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <span className="bg-white/10 rounded-lg p-1.5">
            <ShieldAlert size={16} className="text-white" />
          </span>
          AetherNet
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-6 text-sm text-[#A0A0A8]">
          {["about", "services", "faqs"].map((id) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="capitalize hover:text-white transition-colors"
            >
              {id}
            </button>
          ))}
        </nav>

        {/* Social + legal */}
        <div className="flex items-center gap-4 text-[#666]">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="hover:text-white transition-colors"
          >
            <Github size={18} />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
            className="hover:text-white transition-colors"
          >
            <Twitter size={18} />
          </a>
          <span className="text-xs text-[#555]">
            &copy; {new Date().getFullYear()} AetherNet
          </span>
        </div>
      </div>
    </footer>
  );
}
