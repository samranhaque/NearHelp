"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Radio,
  LayoutDashboard,
  MapPin,
  Map,
  AlertTriangle,
  BadgeCheck,
  ClipboardList,
  Shield,
  User,
  Star,
  Settings,
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";

const NAV_GROUPS = [
  {
    label: "Overview",
    links: [
      { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
      { icon: MapPin, label: "Live Map", id: "live-map" },
      { icon: Map, label: "Resource Map", id: "resource-map" },
      { icon: AlertTriangle, label: "Active SOS Feed", id: "sos-feed" },
    ],
  },
  {
    label: "Community",
    links: [
      { icon: BadgeCheck, label: "Skill Registry", id: "skill-registry" },
      { icon: ClipboardList, label: "Responder History", id: "responder-history" },
      { icon: Shield, label: "Guardians", id: "guardians" },
    ],
  },
  {
    label: "Account",
    links: [
      { icon: User, label: "Profile & Medical Info", id: "profile" },
      { icon: Star, label: "Trust Score", id: "trust-score" },
      { icon: Settings, label: "Settings", id: "settings" },
      { icon: LogOut, label: "Logout", id: "logout" },
    ],
  },
];

export default function Sidebar({
  activeView,
  setActiveView,
  isOpen,
  setIsOpen
}: {
  activeView: string,
  setActiveView: any,
  isOpen?: boolean,
  setIsOpen?: (open: boolean) => void
}) {
  const { user, logout } = useAuth();

  const isAdmin = user?.email === 'municipal@community.gov.in';
  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'UI';
  const displayName = user?.name || 'User Identity';

  const filteredNavGroups = NAV_GROUPS.map(group => ({
    ...group,
    links: group.links.filter(link => {
      if (link.id === 'skill-registry' || link.id === 'responder-history') {
        return isAdmin;
      }
      return true;
    })
  })).filter(group => group.links.length > 0);

  const safeNavGroups = filteredNavGroups.map(group => ({
    ...group,
    links: group.links.map(link => ({
      ...link,
      id: (link as any).id || "dashboard"
    }))
  }));

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen?.(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-[#E5E5E5] bg-white transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF3B30]">
              <Radio className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#161618]">AetherNet</span>
          </div>
          <button
            onClick={() => setIsOpen?.(false)}
            className="lg:hidden p-1 text-gray-400 hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User identity strip */}
        <div className="mx-3 mt-3 flex items-center gap-3 rounded-2xl bg-[#F8F8FA] px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#161618]">
            <span className="text-xs font-semibold text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#161618]">{displayName}</p>
            <span className="inline-flex items-center rounded-full bg-[#34C759]/15 px-2 py-0.5 text-[10px] font-medium text-[#34C759]">
              {isAdmin ? 'Admin' : 'Verified Responder'}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {safeNavGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#A0A0A8]">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.links.map(({ icon: Icon, label, id }, index) => {
                  const active = activeView === id;
                  return (
                    <li key={`${id}-${label}`}>
                      <button
                        onClick={() => {
                          if (id === 'logout') {
                            logout();
                          } else {
                            setActiveView(id);
                          }
                        }}
                        className="w-full text-left"
                      >
                        <motion.span
                          whileHover={{ x: active ? 0 : 2 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active
                            ? "bg-[#161618] text-white"
                            : "text-[#555] hover:bg-[#F5F5F5] hover:text-[#161618]"
                            }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {label}
                        </motion.span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

// Ensure AnimatePresence is imported
import { AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
