"use client";

import { useState, useEffect } from "react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Star, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

export default function ResponderHistoryCard() {
    const { user } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [ratingData, setRatingData] = useState<Record<string, number>>({});

    useEffect(() => {
        api.get('/sos/history').then(({ data }) => {
            setHistory(Array.isArray(data) ? data : []);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const submitRating = async (sosId: string, score: number) => {
        try {
            await api.post(`/ratings/${sosId}`, { score });
            setRatingData(prev => ({ ...prev, [sosId]: score }));
        } catch (err: any) {
            alert("Failed to submit rating.");
        }
    };

    const getStatusColor = (status: string) => {
        if (status === 'resolved') return 'text-green-500';
        if (status === 'active') return 'text-red-500';
        return 'text-yellow-500';
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-2xl bg-white border border-gray-200 p-6 animate-pulse h-24" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-[#161618]">Responder History</h2>
                <p className="text-sm text-gray-500 mt-1">Your past emergency responses and interactions.</p>
            </div>

            {history.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">
                    No history found.
                </div>
            ) : (
                <div className="space-y-3">
                    {history.map((sos: any) => (
                        <div key={sos._id} className="rounded-2xl bg-white border border-gray-200 p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                                        <span className="text-red-600 text-sm font-bold">{sos.type?.charAt(0) || 'S'}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[#161618]">{sos.type || 'SOS'} Emergency</p>
                                        <p className="text-xs text-gray-400">{new Date(sos.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-semibold capitalize ${getStatusColor(sos.status)}`}>{sos.status}</span>
                                    <button onClick={() => setExpandedId(expandedId === sos._id ? null : sos._id)}>
                                        {expandedId === sos._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {expandedId === sos._id && (
                                <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 space-y-3">
                                    {sos.aiGuidance && (
                                        <div className="bg-blue-50 rounded-xl p-4">
                                            <p className="text-xs font-semibold text-blue-700 mb-1">AI Summary</p>
                                            <p className="text-blue-800 text-sm">{sos.aiGuidance}</p>
                                        </div>
                                    )}

                                    {sos.responder && sos.status === 'resolved' && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 mb-2">Rate Responder: {sos.responder.name}</p>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button key={star} onClick={() => submitRating(sos._id, star)}>
                                                        <Star
                                                            className={`h-5 w-5 ${ratingData[sos._id] >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
