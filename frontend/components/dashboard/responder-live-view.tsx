"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import api from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { useAuth } from "../../context/AuthContext";
import { Send, CheckCircle, X, MapPin } from "lucide-react";

// Dynamic import to avoid SSR issues with Leaflet
const RespondMap = dynamic(() => import("./responder-map"), { ssr: false });

export default function ResponderLiveView({ sos, onClose }: { sos: any, onClose: () => void }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>(() => {
        // Initialize with existing chat history
        if (!sos?.chat_log) return [];
        return sos.chat_log.map((log: any) => ({
            senderId: log.sender,
            senderName: log.sender === user?.id ? user?.name : (sos.users?.name || 'User'),
            message: log.message,
            timestamp: log.timestamp
        }));
    });
    const [input, setInput] = useState('');
    const [resolving, setResolving] = useState(false);
    const [resolved, setResolved] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!sos?._id && !sos?.id) return;
        const socket = getSocket();
        if (!socket) return;
        const sosId = sos._id || sos.id;

        // Join the SOS chat room
        socket.emit('sos:join', { sosId });

        socket.on('chat:message', (msg: any) => {
            setMessages(prev => [...prev, msg]);
        });
        socket.on('sos:resolved', () => setResolved(true));

        return () => {
            socket.off('chat:message');
            socket.off('sos:resolved');
        };
    }, [sos?._id, sos?.id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        const socket = getSocket();
        if (socket) {
            socket.emit('chat:message', {
                sosId: sos._id || sos.id,
                message: input.trim(),          // chatHandler.js expects 'message' not 'text'
            });
        }
        // Optimistically add own message
        setMessages(prev => [...prev, {
            senderId: user?.id || user?._id,
            senderName: user?.name,
            message: input.trim(),
            timestamp: Date.now()
        }]);
        setInput('');
    };

    const resolveNow = async () => {
        setResolving(true);
        try {
            await api.post(`/sos/${sos._id}/resolve`);
            setResolved(true);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to resolve');
        } finally {
            setResolving(false);
        }
    };

    const isSeeker = user?.id === sos?.seeker_id || user?._id === sos?.seeker_id || sos?.is_anonymous;
    const responderName = sos?.users?.name || 'A community member';

    // Auto-close after 3 seconds when resolved
    useEffect(() => {
        if (resolved) {
            const timer = setTimeout(() => onClose(), 3000);
            return () => clearTimeout(timer);
        }
    }, [resolved, onClose]);

    if (resolved) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center gap-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <h2 className="text-2xl font-bold text-[#161618]">SOS Resolved</h2>
                <p className="text-gray-500">{isSeeker ? "We're glad you're safe! The SOS has been closed." : "You've successfully helped resolve this emergency. Great work!"}</p>
                <button onClick={onClose} className="px-6 py-3 bg-[#161618] text-white rounded-xl font-semibold hover:bg-black">
                    Returning to Dashboard...
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-[#161618]">
                        {isSeeker ? "Help is on the way!" : "Responder Live View"}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {isSeeker
                            ? `Responders have been notified of your ${sos?.type || 'SOS'} alert.`
                            : `${sos?.type || 'SOS'} Emergency · ${sos?.status}`
                        }
                    </p>
                </div>
                <div className="flex gap-3">
                    {isSeeker && (
                        <button
                            onClick={resolveNow}
                            disabled={resolving}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50"
                        >
                            <CheckCircle className="h-4 w-4" />
                            {resolving ? 'Resolving...' : 'I am safe (Resolve)'}
                        </button>
                    )}
                    <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 p-2.5 rounded-xl">
                        <X className="h-5 w-5 text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-5 gap-4" style={{ minHeight: '65vh' }}>
                {/* Map Panel — 60% on desktop, 40vh on mobile */}
                <div className="lg:col-span-3 h-[40vh] lg:h-auto rounded-2xl overflow-hidden border border-gray-200 order-1">
                    <RespondMap sos={sos} user={user} />
                </div>

                {/* Chat Panel — 40% on desktop, flexible on mobile */}
                <div className="lg:col-span-2 h-[50vh] lg:h-auto rounded-2xl border border-gray-200 bg-white flex flex-col order-2">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-semibold text-[#161618] text-sm">Live Chat</h3>
                        <p className="text-xs text-gray-400">Secured channel with seeker</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="text-center text-sm text-gray-400 pt-8">
                                <MapPin className="h-6 w-6 mx-auto mb-2 opacity-30" />
                                Chat will appear here.<br />Say hello to the person in need.
                            </div>
                        )}
                        {messages.map((msg, i) => {
                            const isMe = msg.senderId === (user?.id || user?._id);
                            return (
                                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-[#161618] text-white rounded-br-sm' : 'bg-gray-100 text-[#161618] rounded-bl-sm'}`}>
                                        {!isMe && <p className="text-xs font-semibold opacity-60 mb-0.5">{msg.senderName}</p>}
                                        <p>{msg.message || msg.text}</p>
                                        <p className={`text-[10px] mt-1 opacity-50`}>
                                            {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 flex gap-2">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-[#161618] focus:outline-none focus:ring-2 focus:ring-[#FF3B30]/30"
                        />
                        <button type="submit" className="bg-[#FF3B30] text-white p-2.5 rounded-xl hover:bg-red-600">
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
