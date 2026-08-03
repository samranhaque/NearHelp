import { useState, useEffect, useRef } from "react";
import { Bell, Phone, X, Check, Shield, AlertTriangle, Clock, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import EmergencyModal from "../emergency-modal";
import { getSocket } from "../../lib/socket";
import api from "../../lib/api";

export default function DashboardHeader({ onMenuClick, onRespond }: { onMenuClick?: () => void, onRespond?: (sos: any) => void }) {
  const { user } = useAuth();
  const [showEmergency, setShowEmergency] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'UI';
  const displayName = user?.name || 'User Identity';
  const unreadCount = notifications.filter(n => n.status === 'pending' || n.status === 'unread').length;

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();

    const socket = getSocket();
    let onNewNotif: any;

    if (socket) {
      onNewNotif = (notif: any) => {
        setNotifications(prev => [notif, ...prev]);
        // Visual ping/sound could go here
      };
      socket.on('notification:new', onNewNotif);
    }

    return () => {
      if (socket && onNewNotif) {
        socket.off('notification:new', onNewNotif);
      }
    };
  }, [user]);

  useEffect(() => {
    // Close dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAction = async (id: string, status: 'accepted' | 'declined' | 'read' | 'viewed') => {
    try {
      await api.put(`/notifications/${id}/status`, { status });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status } : n));
    } catch (err) {
      console.error("Failed to update notification:", err);
    }
  };

  const handleSOSClick = async (notif: any) => {
    if (!onRespond) return;
    try {
      const { data: sos } = await api.get(`/sos/${notif.data.sos_id}`);
      onRespond(sos);
      setShowNotifications(false);
      handleAction(notif.id, 'read');
    } catch (err) {
      console.error("Failed to fetch SOS for notification:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n =>
        ['unread', 'pending'].includes(n.status) ? { ...n, status: 'read' } : n
      ));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-[40] flex h-20 items-center justify-between border-b border-[#E5E5E5] bg-[#F8F8FA]/80 px-4 lg:px-8 backdrop-blur-md">
        {/* Left: Mobile Menu + title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl bg-white border border-gray-200 text-black hover:bg-gray-50"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center">
            <h1 className="text-lg font-extrabold tracking-tighter text-black lg:hidden">AetherNet</h1>
          </div>
        </div>

        {/* Right: Emergency pill + bell + user */}
        <div className="flex items-center gap-2 lg:gap-3">
          <button
            onClick={() => setShowEmergency(true)}
            className="bg-[#FF3B30] border-2 border-[#CC2A20] rounded-full px-2 lg:px-3 py-1.5 flex items-center gap-1.5 lg:gap-2 hover:bg-[#CC2A20] transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-[10px] lg:text-sm font-bold uppercase tracking-wide">Emergency</span>
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className={`flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-full border shadow-sm transition-all hover:shadow-md ${showNotifications ? 'bg-[#161618] text-white border-[#161618]' : 'bg-white text-[#161618] border-[#E5E5E5]'}`}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF3B30] text-[10px] font-bold text-white border-2 border-[#F8F8FA]">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-[-60px] sm:right-0 mt-3 w-[280px] sm:w-80 overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-2xl z-[110]"
                >
                  <div className="bg-[#F8F8FA] px-5 py-4 border-b border-[#E5E5E5]">
                    <h3 className="text-sm font-bold text-[#161618]">Notifications</h3>
                  </div>

                  <div className="max-h-[350px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notif) => (
                          <div key={notif.id} className={`p-4 transition-colors ${notif.status === 'pending' ? 'bg-[#FF3B30]/5' : 'hover:bg-gray-50'}`}>
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 p-2 rounded-lg shrink-0 ${notif.type.startsWith('guardian_') ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'}`}>
                                {notif.type.startsWith('guardian_') ? <Shield className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-[#161618] mb-0.5">
                                  {notif.type === 'guardian_request' ? 'Guardian Request' : notif.type === 'guardian_accepted' ? 'Guardian Accepted' : 'Emergency Alert'}
                                </p>
                                <p className="text-[13px] text-gray-600 leading-snug break-words">
                                  {notif.type === 'guardian_request'
                                    ? <><span className="font-semibold text-[#161618]">{notif.sender?.name || 'Someone'}</span> wants you to be their guardian.</>
                                    : notif.data?.message || 'New emergency alert nearby.'}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-tighter">
                                  <Clock className="h-2.5 w-2.5" />
                                  {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>

                                {notif.type === 'sos_alert' && (
                                  <button
                                    onClick={() => handleSOSClick(notif)}
                                    className="mt-3 w-full bg-[#FF3B30] text-white text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#CC2A20] transition-colors shadow-sm"
                                  >
                                    <AlertTriangle className="h-3 w-3" /> View Emergency
                                  </button>
                                )}

                                {notif.type === 'guardian_request' && notif.status === 'pending' && (
                                  <div className="mt-3 flex gap-2">
                                    <button
                                      onClick={() => handleAction(notif.id, 'accepted')}
                                      className="flex-1 bg-[#161618] text-white text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1.5 hover:bg-black transition-colors"
                                    >
                                      <Check className="h-3 w-3" /> Accept
                                    </button>
                                    <button
                                      onClick={() => handleAction(notif.id, 'declined')}
                                      className="flex-1 bg-white border border-gray-200 text-gray-500 text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
                                    >
                                      <X className="h-3 w-3" /> Decline
                                    </button>
                                  </div>
                                )}

                                {notif.status === 'accepted' && (
                                  <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-green-600">
                                    <Check className="h-3 w-3" /> Accepted
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {notifications.filter(n => ['unread', 'pending'].includes(n.status)).length > 0 && (
                    <div className="bg-[#F8F8FA] p-3 text-center border-t border-[#E5E5E5]">
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-bold text-[#161618] hover:underline uppercase tracking-wider"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User capsule */}
          <div className="flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-white py-1.5 pl-1.5 pr-2.5 lg:pr-3 shadow-sm">
            <div className="flex h-6 w-6 lg:h-7 lg:w-7 items-center justify-center rounded-full bg-[#161618]">
              <span className="text-[9px] lg:text-[10px] font-semibold text-white">{initials}</span>
            </div>
            <span className="hidden sm:inline text-xs lg:text-sm font-medium text-[#161618] truncate max-w-[80px] lg:max-w-none">{displayName}</span>
          </div>
        </div>
      </header>
      {showEmergency && <EmergencyModal onClose={() => setShowEmergency(false)} />}
    </>
  );
}
