const supabase = require('../config/supabase');

const userEmitCounters = {};

module.exports = (io, socket) => {
    socket.on('location:update', async (data) => {
        try {
            const { lat, lng } = data;
            const userId = socket.user.id;

            socket.user.lat = lat;
            socket.user.lng = lng;

            if (!userEmitCounters[userId]) userEmitCounters[userId] = 0;
            userEmitCounters[userId]++;

            // Debounce DB writes — every 5 socket events
            if (userEmitCounters[userId] >= 5) {
                await supabase.from('users').update({ lat, lng }).eq('id', userId);
                userEmitCounters[userId] = 0;
            }

            // Emit to all active SOS rooms this user participates in
            const { data: activeSOS } = await supabase.from('sos')
                .select('id')
                .in('status', ['active', 'responding'])
                .or(`seeker_id.eq.${userId},responders.cs.{${userId}}`);

            (activeSOS || []).forEach(sos => {
                io.to(`sos:${sos.id}`).emit('location:responder_moved', { userId, lat, lng });
            });
        } catch (error) {
            console.error('Error in location:update', error);
        }
    });
};
