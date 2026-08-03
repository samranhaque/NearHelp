"use client";

import { useState, useEffect } from "react";
import api from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { useAuth } from "../../context/AuthContext";
import { BarChart2, Users, AlertTriangle, CheckCircle, MapPin, ShieldAlert } from "lucide-react";
import dynamic from "next/dynamic";

const AdminMap = dynamic(() => import("./responder-map"), { ssr: false });
const HistoricalHeatmap = dynamic(() => import("./historical-heatmap"), { ssr: false });

export default function AdminDashboard() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState<any>(null);
    const [activeSOS, setActiveSOS] = useState<any[]>([]);
    const [flaggedUsers, setFlaggedUsers] = useState<any[]>([]);
    const [skillQueue, setSkillQueue] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSos, setSelectedSos] = useState<any | null>(null);
    const [heatmapData, setHeatmapData] = useState<any[]>([]);
    const [mapMode, setMapMode] = useState<'live' | 'heatmap'>('live');

    const fetchAdminData = async () => {
        try {
            const [analyticsRes, liveRes, usersRes, skillsRes, heatmapRes] = await Promise.allSettled([
                api.get('/admin/analytics'),
                api.get('/admin/live-map'),
                api.get('/admin/users'),
                api.get('/admin/skills/queue'),
                api.get('/admin/analytics/heatmap'),
            ]);
            if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data);
            if (liveRes.status === 'fulfilled') setActiveSOS(liveRes.value.data.activeSOS || []);
            if (usersRes.status === 'fulfilled') setFlaggedUsers((usersRes.value.data || []).filter((u: any) => u.falseAlertCount > 1));
            if (skillsRes.status === 'fulfilled') setSkillQueue(skillsRes.value.data || []);
            if (heatmapRes.status === 'fulfilled') setHeatmapData(heatmapRes.value.data || []);
            if (usersRes.status === 'fulfilled') setFlaggedUsers((usersRes.value.data || []).filter((u: any) => u.falseAlertCount > 1));
            if (skillsRes.status === 'fulfilled') setSkillQueue(skillsRes.value.data || []);
        } catch (err) {
            console.error("Admin data fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
        const socket = getSocket();
        if (socket) {
            socket.on('admin:sos_created', fetchAdminData);
            socket.on('admin:sos_resolved', fetchAdminData);
            socket.on('admin:current_state', (data: any) => {
                setActiveSOS(data.activeSOS || []);
            });
            socket.on('admin:user_online', fetchAdminData);
            socket.on('admin:user_offline', fetchAdminData);
        }
        return () => {
            if (socket) {
                socket.off('admin:sos_created', fetchAdminData);
                socket.off('admin:sos_resolved', fetchAdminData);
                socket.off('admin:user_online', fetchAdminData);
                socket.off('admin:user_offline', fetchAdminData);
                socket.off('admin:current_state');
            }
        };
    }, []);

    const suspendUser = async (userId: string) => {
        try {
            await api.post(`/admin/users/${userId}/suspend`);
            fetchAdminData();
        } catch (err: any) {
            alert('Failed to suspend user.');
        }
    };

    const verifySkill = async (userId: string, skill: string) => {
        try {
            await api.post(`/admin/skills/${userId}/verify`, { skill });
            fetchAdminData();
        } catch (err: any) {
            alert('Skill verification failed.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 rounded-full border-4 border-gray-200 border-t-[#FF3B30]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-[#161618]">Admin Live Dashboard</h2>
                    <p className="text-xs text-gray-400 mt-1">Logged in as <span className="font-semibold text-[#FF3B30]">{user?.email}</span></p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setMapMode('live')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${mapMode === 'live' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Live Incidents
                    </button>
                    <button 
                        onClick={() => setMapMode('heatmap')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${mapMode === 'heatmap' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Historical Heatmap
                    </button>
                </div>
            </div>

            {/* Analytics Row */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { icon: AlertTriangle, label: 'Active SOS', value: activeSOS.length, color: 'text-red-500', bg: 'bg-red-50' },
                    { icon: CheckCircle, label: 'Resolved Today', value: analytics?.resolvedToday ?? '—', color: 'text-green-500', bg: 'bg-green-50' },
                    { icon: Users, label: 'Online Users', value: analytics?.onlineUsers ?? '—', color: 'text-blue-500', bg: 'bg-blue-50' },
                    { icon: BarChart2, label: 'Avg Response (min)', value: analytics?.avgResponseTime ?? '—', color: 'text-purple-500', bg: 'bg-purple-50' },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                    <div key={label} className={`${bg} rounded-2xl p-5 flex items-center gap-4 border border-gray-100`}>
                        <Icon className={`h-8 w-8 ${color}`} />
                        <div>
                            <p className="text-2xl font-black text-[#161618]">{value}</p>
                            <p className="text-xs text-gray-500">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Live Map + SOS list side by side */}
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 h-72 rounded-2xl overflow-hidden border border-gray-200">
                    {mapMode === 'heatmap' ? (
                        <HistoricalHeatmap data={heatmapData} />
                    ) : selectedSos ? (
                        <AdminMap sos={selectedSos} user={user} />
                    ) : activeSOS.length > 0 ? (
                        <AdminMap sos={activeSOS[0]} user={user} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50">
                            <MapPin className="h-8 w-8 opacity-30" />
                        </div>
                    )}
                </div>

                <div className="col-span-1 bg-white border border-gray-200 rounded-2xl overflow-y-auto">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-semibold text-sm text-[#161618]">Live SOS Events</h3>
                    </div>
                    {activeSOS.length === 0 ? (
                        <p className="p-5 text-sm text-gray-400 text-center">No active events.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {activeSOS.map((sos: any) => (
                                <li key={sos.id || sos._id}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 ${(selectedSos?.id || selectedSos?._id) === (sos.id || sos._id) ? 'bg-red-50' : ''}`}
                                    onClick={() => setSelectedSos(sos)}
                                >
                                    <p className="text-sm font-semibold text-[#161618]">{sos.type}</p>
                                    <p className="text-xs text-gray-400">{sos.status} · {new Date(sos.created_at || sos.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Flagged Users */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-[#161618]">Flagged Users</h3>
                </div>
                {flaggedUsers.length === 0 ? (
                    <p className="p-5 text-sm text-gray-400">No flagged users.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <th className="py-3 px-5 text-left">Name</th>
                                <th className="py-3 px-5 text-left">Email</th>
                                <th className="py-3 px-5 text-left">False Alerts</th>
                                <th className="py-3 px-5 text-left">Status</th>
                                <th className="py-3 px-5 text-left">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(flaggedUsers || []).map((u: any) => (
                                <tr key={u.id || u._id} className="hover:bg-gray-50">
                                    <td className="py-3 px-5 font-medium text-[#161618]">{u.name}</td>
                                    <td className="py-3 px-5 text-gray-500">{u.email}</td>
                                    <td className="py-3 px-5 text-red-500 font-semibold">{u.false_alert_count || u.falseAlertCount}</td>
                                    <td className="py-3 px-5">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_suspended || u.isSuspended ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {u.is_suspended || u.isSuspended ? 'Suspended' : 'Flagged'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-5">
                                        {!(u.is_suspended || u.isSuspended) && (
                                            <button onClick={() => suspendUser(u.id || u._id)} className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700">
                                                Suspend
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Skill Verification Queue */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold text-[#161618]">Skill Verification Queue</h3>
                </div>
                {skillQueue.length === 0 ? (
                    <p className="p-5 text-sm text-gray-400">No pending skill verifications.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <th className="py-3 px-5 text-left">User</th>
                                <th className="py-3 px-5 text-left">Skill</th>
                                <th className="py-3 px-5 text-left">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(Array.isArray(skillQueue) ? skillQueue : []).map((req: any) => (
                                <tr key={`${req.id || req.userId}-${req.skill || 'Medical'}`} className="hover:bg-gray-50">
                                    <td className="py-3 px-5 font-medium text-[#161618]">{req.name || req.email}</td>
                                    <td className="py-3 px-5 text-gray-500">{req.skill || 'Medical / First Aid'}</td>
                                    <td className="py-3 px-5">
                                        <button onClick={() => verifySkill(req.id || req.userId, req.skill || 'Medical / First Aid')} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700">
                                            Verify
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
