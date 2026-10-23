import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
    const socketUrl = process.env.NODE_ENV === 'development'
        ? (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000')
        : window.location.origin;
    console.log('[Socket] 🔌 Attempting to connect with URL:', socketUrl);
    
    if (socket) {
        // If already connected with SAME token, just return
        if (socket.auth?.token === token && socket.connected) {
            console.log('[Socket] ✅ Already connected with same token');
            return socket;
        }
        // If different token, disconnect and re-init
        console.log('[Socket] 🔄 Disconnecting old socket');
        socket.disconnect();
    }

    socket = io(socketUrl, {
        autoConnect: false,
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
    });

    socket.connect();
    console.log('[Socket] 🚀 Connection initiated');

    socket.on('connect', () => {
        console.log('[Socket] ✅ Connected! Socket ID:', socket.id);
    });

    socket.on('connect_error', (err) => {
        console.error('[Socket] ❌ Connect error:', err.message);
    });

    socket.on('disconnect', (reason) => {
        console.warn('[Socket] ⚠️ Disconnected:', reason);
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => socket;
