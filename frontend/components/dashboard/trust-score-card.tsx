"use client";

import { useState, useEffect } from "react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Star, TrendingUp, MessageSquare } from "lucide-react";

export default function TrustScoreCard() {
    const { user } = useAuth();
    const [trust, setTrust] = useState<any>(null);
    const [ratings, setRatings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchTrust = async () => {
            try {
                const { data } = await api.get(`/ratings/responder/${user._id || user.id}`);
                setTrust(data.summary || data);
                setRatings(data.ratings || []);
            } catch (err) {
                console.error('Trust fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTrust();
    }, [user]);

    const score = trust?.averageScore ?? user?.trustScore ?? 0;
    const total = trust?.totalCount ?? 0;

    const getScoreColor = (s: number) => {
        if (s >= 4) return 'text-green-600';
        if (s >= 3) return 'text-yellow-500';
        return 'text-red-500';
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 rounded-full border-4 border-gray-200 border-t-[#FF3B30]" /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-[#161618]">Trust Score</h2>
                <p className="text-sm text-gray-500 mt-1">Your community reputation as a trusted responder.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <div className={`text-8xl font-black ${getScoreColor(score)}`}>{score.toFixed(1)}</div>
                <div className="flex items-center justify-center gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-5 w-5 ${score >= s ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                    ))}
                </div>
                <p className="mt-2 text-sm text-gray-400">{total} ratings · Updated live</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
                    <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-[#161618]">{trust?.totalResponses ?? 0}</p>
                    <p className="text-xs text-gray-400">Responses</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
                    <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-[#161618]">{total}</p>
                    <p className="text-xs text-gray-400">Ratings</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
                    <MessageSquare className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-[#161618]">{ratings.length}</p>
                    <p className="text-xs text-gray-400">Reviews</p>
                </div>
            </div>

            {ratings.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-semibold text-[#161618]">Recent Reviews</h3>
                    {ratings.slice(0, 5).map((r: any, i: number) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} className={`h-3.5 w-3.5 ${r.rating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                ))}
                                <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                            </div>
                            {r.feedback && <p className="text-sm text-gray-600">{r.feedback}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
