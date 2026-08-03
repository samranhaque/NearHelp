"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Sidebar from "@/components/dashboard/sidebar";
import DashboardHeader from "@/components/dashboard/header";
import { useAuth } from "../../context/AuthContext";
import dynamic from "next/dynamic";
import api from "../../lib/api";

// Core dashboard widgets
const LiveMapCard = dynamic(() => import("@/components/dashboard/live-map-card"), { ssr: false });
import SosStatsCard from "@/components/dashboard/sos-stats-card";
import SosFeedCard from "@/components/dashboard/sos-feed-card";
import AiAssistantCard from "@/components/dashboard/ai-assistant-card";
import SkillRegistryCard from "@/components/dashboard/skill-registry-card";
import LocationTracker from "@/components/dashboard/location-tracker";

// Full-page views
import ResponderHistoryCard from "@/components/dashboard/responder-history-card";
import GuardiansCard from "@/components/dashboard/guardians-card";
import ProfileCard from "@/components/dashboard/profile-card";
import TrustScoreCard from "@/components/dashboard/trust-score-card";
import SettingsCard from "@/components/dashboard/settings-card";
import DebriefBanner from "@/components/dashboard/debrief-banner";
import AdminDashboard from "@/components/dashboard/admin-dashboard";
import ResourceMapCard from "@/components/dashboard/resource-map-card";
import ResponderLiveView from "@/components/dashboard/responder-live-view";
import { getSocket } from "../../lib/socket";

// Mutual response flow
import { PresenceNotificationQueue } from "@/components/dashboard/presence-notification";
import MutualResponseView from "@/components/dashboard/mutual-response-view";

export default function DashboardPage() {
  const { user } = useAuth();
  const socket = getSocket();
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mutual response state
  const [notificationQueue, setNotificationQueue] = useState<any[]>([]);
  const [mutualPayload, setMutualPayload] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Seeker's own active SOS — used to open ResponderLiveView for the seeker's side
  const [activeSOS, setActiveSOS] = useState<any>(null);

  const isAdmin = user?.email === "municipal@community.gov.in";

  // Get user's live location for distance badge in presence notifications
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  // On mount: check if seeker already has an active SOS in progress, and ask for Notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
    
    if (!user || !socket) return;
    const sync = async () => {
      try {
        const { data } = await api.get("/sos/me/active");
        if (data) {
          setActiveSOS(data);
          socket.emit("sos:join", { sosId: data.id || data._id });
          // If already in responding status with a responder, open the live view
          if (data.status === "responding") {
            setActiveView("responding");
          }
        }
      } catch (e) { }
    };
    sync();
  }, [user, socket]);

  // Main socket wiring
  useEffect(() => {
    if (!socket) return;

    // Helper to send native browser notification
    const sendNativeNotification = (title: string, body: string) => {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body });
      }
    };

    // Notify nearby users of new SOS → add to presence queue
    const onNewAlert = (data: any) => {
      setNotificationQueue(prev => [...prev, { ...data, isPriority: false }]);
      sendNativeNotification("New Community Alert", `A ${data.sos?.type || 'emergency'} was reported nearby.`);
    };
    const onPriorityAlert = (data: any) => {
      setNotificationQueue(prev => [...prev, { ...data, isPriority: true }]);
      sendNativeNotification("Priority SOS Alert", `Urgent: A ${data.sos?.type || 'emergency'} requires your skills nearby.`);
    };
    const onGuardianAlert = (data: any) => {
      setNotificationQueue(prev => [...prev, { ...data, isGuardian: true, isPriority: true }]);
      sendNativeNotification("Guardian Alert!", `${data.seekerName || 'Someone'} you guard has raised a ${data.sos?.type || 'emergency'} SOS!`);
    };

    // Fires on BOTH seeker and responder when presence confirmed — opens MutualResponseView
    const onMutualOpen = (payload: any) => {
      setMutualPayload(payload);
      setActiveView("responding");
      setNotificationQueue([]);
    };

    // Seeker: their own SOS was just created from the SOS button
    const onSOSCreated = (data: any) => {
      if (data?.seeker?.id === (user?.id || user?._id)) {
        setActiveSOS(data.sos || data);
        socket.emit("sos:join", { sosId: data.sos?.id || data.sos?._id || data.id || data._id });
      }
    };

    // Seeker: someone responded to their SOS (legacy event from sosHandler sos:respond)
    const onResponderJoined = (data: any) => {
      if (activeSOS) {
        setActiveSOS((prev: any) => ({
          ...prev,
          responders: [...(prev?.responders || []), data.responderId],
          status: "responding",
        }));
      }
    };

    socket.on("sos:new_alert", onNewAlert);
    socket.on("sos:priority_alert", onPriorityAlert);
    socket.on("sos:guardian_alert", onGuardianAlert);
    socket.on("response:mutual_open", onMutualOpen);
    socket.on("sos:created", onSOSCreated);
    socket.on("sos:responder_joined", onResponderJoined);

    return () => {
      socket.off("sos:new_alert", onNewAlert);
      socket.off("sos:priority_alert", onPriorityAlert);
      socket.off("sos:guardian_alert", onGuardianAlert);
      socket.off("response:mutual_open", onMutualOpen);
      socket.off("sos:created", onSOSCreated);
      socket.off("sos:responder_joined", onResponderJoined);
    };
  }, [socket, user, activeSOS]);

  // Dismiss front of queue
  const dismissNotification = () => {
    setNotificationQueue(prev => prev.slice(1));
  };

  // Confirm presence — backend emits mutual_open to both parties
  const confirmPresence = async (item: any) => {
    const sosId = item?.sos?.id || item?.sos?._id;
    if (!sosId) return;
    await api.post(`/sos/${sosId}/presence`, { available: true });
    dismissNotification();
    // MutualResponseView opens automatically when server emits response:mutual_open
  };

  const handleCloseResponding = () => {
    setMutualPayload(null);
    setActiveSOS(null);
    setActiveView("dashboard");
  };

  // What to render in the main content area when "responding"
  const renderRespondingView = () => {
    // Priority 1: mutual flow (both seeker and responder see shared map + chat)
    if (mutualPayload) {
      return (
        <div style={{ height: "calc(100vh - 10rem)" }}>
          <MutualResponseView
            payload={mutualPayload}
            currentUser={user}
            onClose={handleCloseResponding}
          />
        </div>
      );
    }
    // Priority 2: seeker is waiting for a responder (legacy live view - own SOS only)
    if (activeSOS) {
      return (
        <div style={{ minHeight: "70vh" }}>
          <ResponderLiveView
            sos={activeSOS}
            onClose={handleCloseResponding}
          />
        </div>
      );
    }
    // Fallback: nothing to show — return to dashboard
    setActiveView("dashboard");
    return null;
  };

  return (
    <>
      <LocationTracker />
      <DebriefBanner />

      {/* Presence confirmation overlay — renders above everything */}
      <AnimatePresence>
        {notificationQueue.length > 0 && (
          <PresenceNotificationQueue
            queue={notificationQueue}
            userLocation={userLocation}
            onDismiss={dismissNotification}
            onConfirm={confirmPresence}
          />
        )}
      </AnimatePresence>

      <div className="flex bg-[#F8F8FA] min-h-screen relative overflow-x-hidden">
        <Sidebar
          activeView={activeView}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          setActiveView={(v: string) => {
            if (v !== "responding") {
              setMutualPayload(null);
              setActiveSOS(null);
            }
            setActiveView(v);
            setSidebarOpen(false);
          }}
        />
        <div className={`flex flex-col min-h-screen w-full transition-all duration-300 ${sidebarOpen ? "blur-sm lg:blur-none" : ""} lg:pl-64`}>
          <DashboardHeader
            onMenuClick={() => setSidebarOpen(true)}
            onRespond={async (sos: any) => {
              // Trigger mutual flow from header notification click
              const sosId = sos.id || sos._id;
              if (!sosId) return;
              try {
                // This triggers the server to emit response:mutual_open to both parties
                await api.post(`/sos/${sosId}/presence`, { available: true });
              } catch (e: any) {
                // If it fails (e.g. they are already responding), use the legacy fallback just in case
                if (e.response?.status !== 400 && e.response?.status !== 403) {
                  setActiveSOS(sos);
                  setActiveView("responding");
                } else {
                  alert(e.response?.data?.message || 'Cannot respond to this SOS.');
                }
              }
            }}
          />
          <main className="flex-1 p-4 lg:p-8">

            {/* Responding view — mutual flow or legacy seeker view */}
            {activeView === "responding" ? (
              renderRespondingView()
            ) : (
              <>
                {/* Admin */}
                {isAdmin && activeView === "dashboard" && <AdminDashboard />}

                {/* Default dashboard */}
                {!isAdmin && activeView === "dashboard" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                    <div className="col-span-1 lg:col-span-8"><LiveMapCard /></div>
                    <div className="col-span-1 lg:col-span-4"><SosStatsCard /></div>
                    <div className="col-span-1 lg:col-span-5">
                      {/* onRespond is now a hint only — actual view switching
                          happens via the response:mutual_open socket event */}
                      <SosFeedCard onRespond={() => { }} />
                    </div>
                    <div className="col-span-1 lg:col-span-7">
                      <AiAssistantCard guidance={[]} activeSOS={null} />
                    </div>
                  </div>
                )}

                {activeView === "live-map" && (
                  <div className="rounded-2xl overflow-hidden border border-gray-200" style={{ height: "80vh" }}>
                    <LiveMapCard />
                  </div>
                )}

                {activeView === "sos-feed" && (
                  <div className="max-w-3xl mx-auto">
                    <div className="mb-4">
                      <h2 className="text-2xl font-bold text-[#161618]">Active SOS Feed</h2>
                      <p className="text-sm text-gray-500 mt-1">Click Respond to take on an emergency near you.</p>
                    </div>
                    <SosFeedCard onRespond={() => { }} />
                  </div>
                )}

                {activeView === "skill-registry" && (
                  <div className="max-w-5xl mx-auto">
                    {isAdmin ? <SkillRegistryCard /> : <p className="text-gray-500">Access Restricted</p>}
                  </div>
                )}

                {activeView === "resource-map" && (
                  <div style={{ height: "calc(100vh - 12rem)" }}>
                    <ResourceMapCard />
                  </div>
                )}

                {activeView === "responder-history" && (isAdmin ? <ResponderHistoryCard /> : <p className="text-gray-500">Access Restricted</p>)}
                {activeView === "guardians" && <GuardiansCard />}
                {activeView === "profile" && <ProfileCard />}
                {activeView === "trust-score" && <TrustScoreCard />}
                {activeView === "settings" && <SettingsCard />}
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
