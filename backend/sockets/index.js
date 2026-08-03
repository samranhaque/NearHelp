const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const sosHandler = require('./sosHandler');
const chatHandler = require('./chatHandler');
const locationHandler = require('./locationHandler');

module.exports = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.token;
            if (!token) return next(new Error('Authentication error: No token provided'));

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            if (!decoded || !decoded.id) {
                console.error('[Socket Auth] Decoded token missing ID:', decoded);
                return next(new Error('Authentication error: Invalid token payload'));
            }

            const { data: user, error } = await supabase.from('users')
                .select('id, name, email, skills, is_suspended, lat, lng, guardians')
                .eq('id', decoded.id).single();

            if (error) {
                console.error('[Socket Auth] Supabase error fetching user:', error);
                return next(new Error(`Authentication error: Database failure` || error.message));
            }
            if (!user) {
                console.error('[Socket Auth] User not found in DB for ID:', decoded.id);
                return next(new Error('Authentication error: User not found'));
            }
            if (user.is_suspended) return next(new Error('Authentication error: Account suspended'));

            socket.user = { ...user, _id: user.id };
            next();
        } catch (error) {
            console.error('Socket Auth error:', error);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', async (socket) => {
        console.log(`User connected: ${socket.user.name} (${socket.id})`);

        await supabase.from('users').update({ is_online: true }).eq('id', socket.user.id);
        io.to('admin:room').emit('admin:user_online', { userId: socket.user.id });

        socket.join(`user:${socket.user.id}`);

        if (socket.user.email === 'municipal@community.gov.in') {
            socket.join('admin:room');
            const { data: activeSOS } = await supabase.from('sos')
                .select('id, type, status, lat, lng, seeker_id, responders, created_at')
                .in('status', ['active', 'responding']);
            const { data: onlineUsers } = await supabase.from('users')
                .select('id, name, lat, lng, skills, is_online').eq('is_online', true);
            socket.emit('admin:current_state', { activeSOS: activeSOS || [], onlineUsers: onlineUsers || [] });
        }

        sosHandler(io, socket);
        chatHandler(io, socket);
        locationHandler(io, socket);

        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${socket.user.name}`);
            await supabase.from('users').update({ is_online: false, last_seen: new Date().toISOString() }).eq('id', socket.user.id);
            io.to('admin:room').emit('admin:user_offline', { userId: socket.user.id });
        });
    });
};
