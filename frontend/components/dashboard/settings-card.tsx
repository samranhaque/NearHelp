"use client";

import { useState } from "react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Bell, Lock, Trash2, Save } from "lucide-react";

export default function SettingsCard() {
    const { user, logout } = useAuth();
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwMsg, setPwMsg] = useState('');
    const [pwSaving, setPwSaving] = useState(false);

    const [notifications, setNotifications] = useState({
        sosAlerts: true,
        guardianAlerts: true,
        communityNews: false,
    });

    const changePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            return setPwMsg("Passwords don't match.");
        }
        setPwSaving(true);
        setPwMsg('');
        try {
            await api.post('/auth/change-password', {
                currentPassword: pwForm.currentPassword,
                newPassword: pwForm.newPassword,
            });
            setPwMsg('Password changed successfully!');
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setPwMsg(err.response?.data?.message || 'Failed to change password.');
        } finally {
            setPwSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-[#161618]">Settings</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your account preferences and security.</p>
            </div>

            {/* Notifications */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Bell className="h-5 w-5 text-[#161618]" />
                    <h3 className="font-semibold text-[#161618]">Notification Preferences</h3>
                </div>
                {Object.entries(notifications).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between">
                        <label className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                        <button
                            onClick={() => setNotifications(prev => ({ ...prev, [key]: !val }))}
                            className={`w-12 h-6 rounded-full transition-colors relative ${val ? 'bg-[#161618]' : 'bg-gray-200'}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${val ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                ))}
                <p className="text-xs text-gray-400">Notification settings are stored locally for now.</p>
            </div>

            {/* Password Change */}
            <form onSubmit={changePassword} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-5 w-5 text-[#161618]" />
                    <h3 className="font-semibold text-[#161618]">Change Password</h3>
                </div>
                {[
                    { label: 'Current Password', key: 'currentPassword' },
                    { label: 'New Password', key: 'newPassword' },
                    { label: 'Confirm New Password', key: 'confirmPassword' }
                ].map(({ label, key }) => (
                    <div key={key}>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                        <input
                            type="password"
                            value={(pwForm as any)[key]}
                            onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#161618] focus:outline-none focus:ring-2 focus:ring-[#FF3B30]/30"
                            required
                        />
                    </div>
                ))}

                {pwMsg && (
                    <p className={`text-sm text-center rounded-xl py-2 ${pwMsg.includes('success') ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>{pwMsg}</p>
                )}

                <button type="submit" disabled={pwSaving} className="w-full bg-[#161618] text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-black disabled:opacity-50">
                    <Save className="h-4 w-4" />
                    {pwSaving ? 'Updating...' : 'Update Password'}
                </button>
            </form>

            {/* Danger Zone */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-red-700 flex items-center gap-2">
                    <Trash2 className="h-5 w-5" /> Danger Zone
                </h3>
                <p className="text-sm text-red-600">Logging out will clear your session. Deleting your account is irreversible.</p>
                <div className="flex gap-3">
                    <button onClick={logout} className="flex-1 border border-red-400 text-red-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-100 transition-colors">
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
}
