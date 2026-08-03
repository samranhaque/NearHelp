"use client";

import { useState, useEffect } from "react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Save, MapPin } from "lucide-react";

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SKILLS = [
    'CPR Trained',
    'Medical / First Aid',
    'Firefighting / Fire Safety',
    'Search & Rescue',
    'Mental Health Support',
    'Counselling / Crisis Support',
    'Car / Vehicle Diagnosis',
    'Electrical Emergency',
    'Structural / Civil Emergency',
    'Legal Aid',
    'Child Safety',
    'Elderly Care',
    'Disaster Management',
    'Swimming / Water Rescue',
    'Security / Crowd Control',
    'Food & Shelter Aid',
    'Translation / Language Aid',
    'None',
];

export default function ProfileCard() {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [profile, setProfile] = useState({
        name: '',
        age: '',
        bloodGroup: '',
        healthConditions: '',
        isPhysicallyDisabled: false,
    });
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || '',
                age: user.age || '',
                bloodGroup: user.blood_group || '',
                healthConditions: user.health_conditions || '',
                isPhysicallyDisabled: user.is_physically_disabled || false,
            });
            setSelectedSkills(user.skills || []);
        }
    }, [user]);

    const saveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMsg('');
        try {
            await api.put('/users/profile', {
                ...profile,
                age: parseInt(profile.age as string) || undefined,
            });
            await api.put('/users/skills', { skills: selectedSkills });
            setMsg('Profile updated successfully!');
        } catch (err: any) {
            setMsg(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const updateGPS = () => {
        if (!navigator.geolocation) return alert('Geolocation not supported.');
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                await api.put('/users/location', { lat: pos.coords.latitude, lng: pos.coords.longitude });
                alert('Location updated!');
            } catch {
                alert('Failed to update location.');
            }
        }, (err) => alert('Location error: ' + err.message));
    };

    const toggleSkill = (skill: string) => {
        if (skill === 'None') { setSelectedSkills(['None']); return; }
        const filtered = selectedSkills.filter(s => s !== 'None');
        setSelectedSkills(filtered.includes(skill) ? filtered.filter(s => s !== skill) : [...filtered, skill]);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-[#161618]">Profile & Medical Info</h2>
                <p className="text-sm text-gray-500 mt-1">Keep your profile and medical data accurate for better emergency response.</p>
            </div>

            <form onSubmit={saveProfile} className="space-y-5 bg-white rounded-2xl border border-gray-200 p-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                        <input
                            value={profile.name}
                            onChange={e => setProfile({ ...profile, name: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#161618] focus:outline-none focus:ring-2 focus:ring-[#FF3B30]/30"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Age</label>
                        <input
                            type="number"
                            value={profile.age}
                            onChange={e => setProfile({ ...profile, age: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#161618] focus:outline-none focus:ring-2 focus:ring-[#FF3B30]/30"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Blood Group</label>
                    <div className="flex flex-wrap gap-2">
                        {BLOOD_GROUPS.map(bg => (
                            <button
                                key={bg} type="button"
                                onClick={() => setProfile({ ...profile, bloodGroup: bg })}
                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${profile.bloodGroup === bg ? 'bg-[#FF3B30] text-white border-[#FF3B30]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#FF3B30]/50'}`}
                            >
                                {bg}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Health Conditions / Allergies</label>
                    <textarea
                        value={profile.healthConditions}
                        onChange={e => setProfile({ ...profile, healthConditions: e.target.value })}
                        rows={3}
                        placeholder="E.g., Diabetic, Allergic to Penicillin..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#161618] focus:outline-none focus:ring-2 focus:ring-[#FF3B30]/30"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="disabled"
                        checked={profile.isPhysicallyDisabled}
                        onChange={e => setProfile({ ...profile, isPhysicallyDisabled: e.target.checked })}
                        className="h-4 w-4"
                    />
                    <label htmlFor="disabled" className="text-sm text-gray-600">I have a physical disability</label>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2">Skills</label>
                    <div className="flex flex-wrap gap-2">
                        {SKILLS.map(skill => (
                            <button
                                key={skill} type="button"
                                onClick={() => toggleSkill(skill)}
                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${selectedSkills.includes(skill) ? 'bg-[#161618] text-white border-[#161618]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                            >
                                {skill}
                            </button>
                        ))}
                    </div>
                </div>

                {msg && <p className={`text-sm text-center rounded-xl py-2 ${msg.includes('success') ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>{msg}</p>}

                <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={saving} className="flex-1 bg-[#161618] hover:bg-black text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                    <button type="button" onClick={updateGPS} className="flex items-center gap-2 px-5 rounded-xl bg-blue-50 text-blue-600 font-semibold text-sm hover:bg-blue-100">
                        <MapPin className="h-4 w-4" />
                        Update GPS
                    </button>
                </div>
            </form>
        </div>
    );
}
