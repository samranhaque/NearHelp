const supabase = require('../config/supabase');

const scheduleWelfareCheck = async (userId, sosId) => {
    try {
        const { data: check } = await supabase.from('welfare_checks').insert({
            user_id: userId,
            sos_id: sosId,
            scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }).select().single();

        setTimeout(async () => {
            try {
                await supabase.from('welfare_checks').update({ sent: true }).eq('id', check.id);
                if (global.io) {
                    global.io.to(`user:${userId}`).emit('welfare:check', {
                        message: "Hi, we are checking in. Are you okay after yesterday's incident?",
                        sosId
                    });
                }
                console.log(`[WELFARE CHECK] Sent to userId: ${userId}`);
            } catch (err) {
                console.error('Error sending welfare check:', err);
            }
        }, 24 * 60 * 60 * 1000);
    } catch (err) {
        console.error('Error scheduling welfare check:', err);
    }
};

const recordWelfareResponse = async (userId, sosId, response) => {
    try {
        const { data: check } = await supabase.from('welfare_checks')
            .update({ response })
            .eq('user_id', userId).eq('sos_id', sosId)
            .order('created_at', { ascending: false })
            .limit(1).select().single();
        return check;
    } catch (err) {
        console.error('Error recording welfare response:', err);
        throw err;
    }
};

module.exports = { scheduleWelfareCheck, recordWelfareResponse };
