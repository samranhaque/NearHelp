const supabase = require('../config/supabase');

module.exports = (io, socket) => {
    // When a seeker wants to join their own SOS room (for mutual updates)
    socket.on('sos:join', async (data) => {
        try {
            const { sosId } = data;
            socket.join(`sos:${sosId}`);
            socket.join(`chat:${sosId}`);
            console.log(`[socket] User ${socket.user.id} joined rooms for SOS: ${sosId}`);
        } catch (error) {
            console.error('Error in sos:join', error);
        }
    });

    // When a user responds to an SOS via WebSocket
    socket.on('sos:respond', async (data) => {
        try {
            const { sosId } = data;

            // Get current SOS data
            const { data: sos, error: fetchError } = await supabase.from('sos')
                .select('*, users!seeker_id(name)')
                .eq('id', sosId).single();

            if (fetchError || !sos) {
                return socket.emit('error', { message: 'SOS not found' });
            }

            // Connect socket to SOS Rooms
            socket.join(`sos:${sosId}`);
            socket.join(`chat:${sosId}`);

            const responders = sos.responders || [];
            if (!responders.includes(socket.user.id)) {
                responders.push(socket.user.id);
                const updates = { responders };
                if (sos.status === 'active') updates.status = 'responding';

                await supabase.from('sos').update(updates).eq('id', sosId);
            }

            // Broadcast to the room that a responder joined
            io.to(`sos:${sosId}`).emit('sos:responder_joined', {
                responderId: socket.user.id,
                responderName: socket.user.name,
                responderSkills: socket.user.skills
            });

            // Additionally, emit generic update
            io.emit('sos:update', {
                sosId,
                status: sos.status === 'active' ? 'responding' : sos.status,
                respondersCount: responders.length
            });

        } catch (error) {
            console.error('Error in sos:respond', error);
            socket.emit('error', { message: 'Failed to process sos:respond' });
        }
    });

    // When seeker resolves via socket
    socket.on('sos:resolve', async (data) => {
        try {
            const { sosId } = data;
            const { data: sos } = await supabase.from('sos').select('seeker_id, created_at').eq('id', sosId).single();

            if (!sos) return socket.emit('error', { message: 'SOS not found' });
            if (sos.seeker_id !== socket.user.id) {
                return socket.emit('error', { message: 'Only seeker can resolve via socket' });
            }

            const resolvedAt = new Date();
            const responseTimeSeconds = Math.round((resolvedAt.getTime() - new Date(sos.created_at).getTime()) / 1000);

            await supabase.from('sos').update({
                status: 'resolved',
                resolved_at: resolvedAt.toISOString(),
                response_time_seconds: responseTimeSeconds
            }).eq('id', sosId);

            io.to(`sos:${sosId}`).emit('sos:resolved', { sosId, responseTimeSeconds });
            io.to(`chat:${sosId}`).emit('sos:resolved', { sosId, responseTimeSeconds });

        } catch (error) {
            console.error('Error in sos:resolve', error);
            socket.emit('error', { message: 'Failed to process sos:resolve' });
        }
    });

    // When responder moves — relay to seeker
    socket.on('location:update', async ({ lat, lng }) => {
        try {
            await supabase.from('users').update({ lat, lng }).eq('id', socket.user.id);

            const { data: activeSOS } = await supabase.from('sos')
                .select('id, seeker_id')
                .contains('responders', [socket.user.id])
                .eq('status', 'responding');

            (activeSOS || []).forEach(sos => {
                if (sos.seeker_id) {
                    global.io.to(`user:${sos.seeker_id}`).emit('location:responder_moved', {
                        sosId: sos.id,
                        responderId: socket.user.id,
                        responderName: socket.user.name,
                        lat, lng
                    });
                }
                global.io.to(`user:${socket.user.id}`).emit('location:self_confirmed', { lat, lng });
            });
        } catch (error) {
            console.error('Error in location:update (sosHandler)', error);
        }
    });
};

/**
 * Global Helper emitted by the Express POST /api/sos/create REST controller.
 */
module.exports.emitSOSAlert = (io, sos, seeker, { priority, general, guardians }) => {
    // 1. Guardians
    guardians.forEach(guardianId => {
        io.to(`user:${guardianId}`).emit('sos:guardian_alert', { sos, seeker });
    });

    // 2. Priority
    priority.forEach(priorityId => {
        io.to(`user:${priorityId}`).emit('sos:priority_alert', { sos, seeker, isPriority: true });
    });

    // 3. General
    general.forEach(generalId => {
        io.to(`user:${generalId}`).emit('sos:new_alert', { sos, seeker, isPriority: false });
    });
};
