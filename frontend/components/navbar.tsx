"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ShieldAlert,
  Home,
  Info,
  Settings,
  HelpCircle,
  Menu,
  X,
  LayoutDashboard,
  LogIn,
  UserPlus,
  Phone,
  Ghost,
} from "lucide-react";
import EmergencyModal from "./emergency-modal";

// ---------------------------------------------------------------------------
// Auth interface — swap these callbacks with your real auth/router calls.
// e.g. replace with signIn(), router.push("/auth/login"), supabase.auth, etc.
// ---------------------------------------------------------------------------
export interface NavbarAuthProps {
  /** Called when the user clicks "Sign In". Wire to your auth provider. */
  onSignIn?: () => void;
  /** Called when the user clicks "Get Started". Wire to your signup flow. */
  onGetStarted?: () => void;
  /** If truthy, renders the "Dashboard" button instead of auth buttons. */
  isAuthenticated?: boolean;
  /** Dashboard href — defaults to "/dashboard" */
  dashboardHref?: string;
}

const NAV_LINKS = [
  { label: "Home", id: "hero", Icon: Home },
  { label: "About", id: "about", Icon: Info },
  { label: "Services", id: "services", Icon: Settings },
  { label: "FAQs", id: "faqs", Icon: HelpCircle },
];

export default function Navbar({
  onSignIn,
  onGetStarted,
  isAuthenticated = false,
  dashboardHref = "/dashboard",
}: NavbarAuthProps) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const contracted = scrolled || isMobile;
  const [activeSection, setActiveSection] = useState("hero");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  useEffect(() => {
    const ids = ["hero", "about", "services", "faqs"];
    const observers: IntersectionObserver[] = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.45 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setDrawerOpen(false);
  };

  return (
    <>
      {/* FIX 1 — single fixed wrapper, justify-center so pills are truly viewport-centered */}
      <motion.div
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="fixed top-4 left-0 right-0 z-50 flex items-center justify-center pointer-events-none px-2 md:px-4"
      >
        {/* Single inline flex row — all three elements in one line */}
        <div className="pointer-events-auto flex items-center gap-1.5 md:gap-2">

          {/* LEFT — hamburger pill (always visible) */}
          <button
            className="flex items-center justify-center border-2 border-[#080808] bg-[#161618] rounded-full p-2.5 shadow-2xl text-white shrink-0"
            onClick={() => setDrawerOpen((v) => !v)}
            aria-label="Open menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* CENTER — logo + nav links pill */}
          <div className="flex items-center gap-1.5 border-2 border-[#080808] bg-[#161618] rounded-full px-2 py-1.5 md:px-3 md:gap-2 shadow-2xl">
            {/* Logo */}
            <button
              onClick={() => scrollTo("hero")}
              className="flex items-center gap-2 shrink-0"
              aria-label="Go to top"
            >
              <span className="bg-[#1E1E22] rounded-lg p-1.5">
                <ShieldAlert className="w-5 h-5 text-white" />
              </span>
              <span className="text-white font-semibold text-sm pr-1">AetherNet</span>
            </button>

            {/* Nav links — hidden on mobile */}
            <nav className="hidden md:flex bg-[#0D0D0F] rounded-full px-1.5 py-1 gap-0.5">
              {NAV_LINKS.map(({ label, id, Icon }) => {
                const active = activeSection === id;
                return (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-all duration-200 ${active
                      ? "bg-white text-[#161618] font-semibold"
                      : "text-[#F5F5F5] hover:bg-[rgba(255,255,255,0.08)]"
                      }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <AnimatePresence initial={false}>
                      {!contracted && (
                        <motion.span
                          key="label"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* EMERGENCY PILL — between nav and auth */}
          <button
            onClick={() => setShowEmergency(true)}
            className="flex items-center gap-1.5 border-2 border-[#CC2A20] bg-[#FF3B30] rounded-full px-2 py-1.5 md:px-3 shadow-2xl hover:bg-[#CC2A20] transition-colors shrink-0"
          >
            <Phone className="w-4 h-4 text-white" />
            <AnimatePresence initial={false}>
              {!contracted && (
                <motion.span
                  key="em-label"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden whitespace-nowrap text-white text-sm font-semibold"
                >
                  Emergency
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* RIGHT — auth pill */}
          <div className="flex items-center gap-0.5 border-2 border-[#080808] bg-[#161618] rounded-full px-1.5 py-1.5 md:px-2 md:gap-1 shadow-2xl shrink-0">
            {isAuthenticated ? (
              <Link
                href={dashboardHref}
                data-action="go-to-dashboard"
                className="flex items-center gap-1.5 bg-white text-[#161618] font-semibold text-sm rounded-full px-3 py-1.5 hover:bg-[#E5E5E5] transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <AnimatePresence initial={false}>
                  {!contracted && (
                    <motion.span
                      key="dash-label"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      Dashboard
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            ) : (
              <>
                {/* Anonymous SOS */}
                <Link href="/anonymous" passHref>
                  <button
                    className="flex items-center gap-1.5 text-[#F5F5F5] text-sm px-3 py-1 rounded-full hover:bg-[rgba(255,255,255,0.08)] transition-colors"
                  >
                    <Ghost className="w-4 h-4 shrink-0" />
                    <AnimatePresence initial={false}>
                      {!contracted && (
                        <motion.span
                          key="anon-label"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          Anonymous
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </Link>

                {/* Sign In */}
                <Link href="/auth/login" passHref>
                  <button
                    data-action="sign-in"
                    className="flex items-center gap-1.5 text-[#F5F5F5] text-sm px-3 py-1 rounded-full hover:bg-[rgba(255,255,255,0.08)] transition-colors"
                  >
                    <LogIn className="w-4 h-4 shrink-0" />
                    <AnimatePresence initial={false}>
                      {!contracted && (
                        <motion.span
                          key="signin-label"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          Sign In
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </Link>

                {/* Get Started */}
                <Link href="/auth/signup" passHref>
                  <button
                    data-action="get-started"
                    className="flex items-center gap-1.5 bg-white text-[#161618] font-semibold text-sm rounded-full px-3 py-1.5 hover:bg-[#E5E5E5] transition-colors"
                  >
                    <UserPlus className="w-4 h-4 shrink-0" />
                    <AnimatePresence initial={false}>
                      {!contracted && (
                        <motion.span
                          key="getstarted-label"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          Get Started
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </Link>
              </>
            )}
          </div>

        </div>
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile / universal full-height drawer                               */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[90] bg-black/50"
            />

            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-72 z-[100] bg-[#161618] border-r border-[#2a2a2e] flex flex-col p-6"
            >
              {/* Drawer header */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <span className="bg-[#1E1E22] rounded-lg p-1.5">
                    <ShieldAlert className="w-5 h-5 text-white" />
                  </span>
                  <span className="text-white font-semibold text-sm">AetherNet</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-[#A0A0A8] hover:text-white transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer nav */}
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map(({ label, id, Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === id
                      ? "bg-[#1E1E22] text-white"
                      : "text-[#A0A0A8] hover:bg-[#1E1E22] hover:text-white"
                      }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </nav>

              {/* Drawer footer — auth actions */}
              <div className="mt-auto flex flex-col gap-3">
                {/* Emergency button always visible in drawer */}
                <button
                  onClick={() => { setShowEmergency(true); setDrawerOpen(false); }}
                  className="w-full bg-[#FF3B30] text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 hover:bg-[#CC2A20] transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Emergency Services
                </button>
                {/* Anonymous SOS */}
                <Link href="/anonymous" passHref onClick={() => setDrawerOpen(false)} className="w-full">
                  <button className="w-full border border-[#2a2a2e] text-[#A0A0A8] rounded-xl py-3 text-sm flex items-center justify-center gap-2 hover:bg-[#1E1E22] hover:text-white transition-colors">
                    <Ghost className="w-4 h-4" />
                    Anonymous SOS
                  </button>
                </Link>
                {isAuthenticated ? (
                  <Link
                    href={dashboardHref}
                    data-action="go-to-dashboard"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-center gap-2 w-full bg-white text-[#161618] font-semibold rounded-xl py-3 text-sm hover:bg-[#E5E5E5] transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/login" passHref onClick={() => setDrawerOpen(false)} className="w-full">
                      <button
                        data-action="sign-in"
                        className="w-full border border-[#2a2a2e] text-white rounded-xl py-3 text-sm hover:bg-[#1E1E22] transition-colors"
                      >
                        Sign In
                      </button>
                    </Link>
                    <Link href="/auth/signup" passHref onClick={() => setDrawerOpen(false)} className="w-full">
                      <button
                        data-action="get-started"
                        className="w-full bg-white text-[#161618] font-semibold rounded-xl py-3 text-sm hover:bg-[#E5E5E5] transition-colors"
                      >
                        Get Started
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {showEmergency && <EmergencyModal onClose={() => setShowEmergency(false)} />}
    </>
  );
}
