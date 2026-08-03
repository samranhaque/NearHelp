"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../lib/api";
import dynamic from "next/dynamic";
// Leaflet must be loaded client-side only to avoid SSR crashes
const SignupMap = dynamic(() => import('./signup-map'), { ssr: false });

export default function SignupPage() {
    const router = useRouter();
    const { register, setUser, user } = useAuth();

    const [step, setStep] = useState(1);

    // Step 1
    const [formData, setFormData] = useState({ name: "", email: "", password: "" });
    // Step 2
    const [profileData, setProfileData] = useState({ age: "", isPhysicallyDisabled: false, bloodGroup: "", healthConditions: "" });
    // Step 3
    const [skills, setSkills] = useState<string[]>([]);
    // Step 4
    const [locationData, setLocationData] = useState({ lat: 28.6139, lng: 77.2090 });
    const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]);
    const [pinSet, setPinSet] = useState(false);

    useEffect(() => {
        if (step === 4 && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setMapCenter([lat, lng]);
                    setLocationData({ lat, lng });
                    setPinSet(true);
                },
                (err) => console.log("Geolocation error in signup:", err),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        }
    }, [step]);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            await register(formData);
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Registration failed");
        } finally { setLoading(false); }
    };

    const handleStep2 = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const res = await api.put("/users/profile", {
                age: parseInt(profileData.age) || null,
                isPhysicallyDisabled: profileData.isPhysicallyDisabled,
                bloodGroup: profileData.bloodGroup,
                healthConditions: profileData.healthConditions
            });
            setUser({ ...user, ...res.data, blood_group: res.data.blood_group });
            setStep(3);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Profile update failed");
        } finally { setLoading(false); }
    };

    const handleStep3 = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const res = await api.put("/users/skills", { skills });
            setUser({ ...user, skills: res.data.skills });
            setStep(4);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Skills update failed");
        } finally { setLoading(false); }
    };

    const handleStep4 = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            await api.put("/users/location", locationData);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Location update failed");
        } finally { setLoading(false); }
    };

    const toggleSkill = (skill: string) => {
        if (skill === "None") {
            setSkills(["None"]);
        } else {
            const newSkills = skills.filter(s => s !== "None");
            if (newSkills.includes(skill)) {
                setSkills(newSkills.filter(s => s !== skill));
            } else {
                setSkills([...newSkills, skill]);
            }
        }
    };

    const inputClasses = "w-full bg-white border border-gray-300 rounded-lg p-3 text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors placeholder:text-gray-400";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
    const buttonClasses = "w-full bg-black border border-black rounded-xl p-3.5 text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all disabled:opacity-70 mt-4";

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-black p-4">
            <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-gray-200 shadow-xl">
                <h1 className="text-3xl font-bold mb-2 text-center text-black">Sign Up</h1>
                <p className="text-center text-gray-500 mb-6 text-sm">Step {step} of 4</p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <form className="space-y-4" onSubmit={handleStep1}>
                        <div>
                            <label className={labelClasses}>Full Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={inputClasses}
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Email</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={inputClasses}
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Password</label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className={inputClasses}
                                placeholder="••••••••"
                            />
                        </div>
                        <button type="submit" disabled={loading} className={buttonClasses}>
                            {loading ? "Creating..." : "Next"}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form className="space-y-4" onSubmit={handleStep2}>
                        <div>
                            <label className={labelClasses}>Age</label>
                            <input type="number" required value={profileData.age} onChange={(e) => setProfileData({ ...profileData, age: e.target.value })} className={inputClasses} placeholder="Your age" />
                        </div>
                        <div>
                            <label className={labelClasses}>Blood Group</label>
                            <select value={profileData.bloodGroup} onChange={(e) => setProfileData({ ...profileData, bloodGroup: e.target.value })} className={inputClasses}>
                                <option value="">Select...</option>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Health Conditions</label>
                            <textarea value={profileData.healthConditions} onChange={(e) => setProfileData({ ...profileData, healthConditions: e.target.value })} className={`${inputClasses} h-24`} placeholder="Any pre-existing conditions..."></textarea>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="checkbox"
                                id="disabled-checkbox"
                                checked={profileData.isPhysicallyDisabled}
                                onChange={(e) => setProfileData({ ...profileData, isPhysicallyDisabled: e.target.checked })}
                                className="w-4 h-4 text-black bg-white border-gray-300 rounded focus:ring-black"
                            />
                            <label htmlFor="disabled-checkbox" className="text-sm font-medium text-gray-700 cursor-pointer">Physically Disabled?</label>
                        </div>
                        <button type="submit" disabled={loading} className={buttonClasses}>
                            {loading ? "Saving..." : "Next"}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form className="space-y-4" onSubmit={handleStep3}>
                        <p className="text-sm text-gray-600 mb-4">Select any verifiable skills you have that can help in an emergency. Pick all that apply.</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
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
                            ].map(skill => (
                                <button
                                    key={skill}
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    className={`p-3 border rounded-xl text-left text-sm transition-colors ${skills.includes(skill)
                                        ? 'border-black bg-black text-white font-semibold'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                                        }`}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                        <button type="submit" disabled={loading} className={buttonClasses}>
                            {loading ? "Saving..." : "Next"}
                        </button>
                    </form>
                )}

                {step === 4 && (
                    <form className="space-y-4" onSubmit={handleStep4}>
                        <p className="text-sm text-gray-600 mb-2">Click on the dynamic map to precisely select your home base location.</p>

                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 shadow-sm z-0">
                            <SignupMap
                                center={mapCenter}
                                pinPosition={pinSet ? locationData : null}
                                setPosition={(pos: any) => { setLocationData(pos); setMapCenter([pos.lat, pos.lng]); }}
                                setPinSet={setPinSet}
                            />
                        </div>
                        {pinSet && (
                            <p className="text-xs text-center font-mono text-gray-500 mt-2">
                                📍 {locationData.lat.toFixed(4)}, {locationData.lng.toFixed(4)}
                            </p>
                        )}

                        <button type="submit" disabled={loading || !pinSet} className={buttonClasses}>
                            {loading ? "Finishing..." : "Complete Setup"}
                        </button>
                    </form>
                )}

                {step === 1 && (
                    <p className="mt-6 text-center text-sm text-gray-600">
                        Already have an account? <a href="/auth/login" className="text-black font-semibold hover:underline">Sign in</a>
                    </p>
                )}
            </div>
        </div>
    );
}