const supabase = require('../config/supabase');

const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        // Ensure userId is a valid UUID to avoid Postgres errors
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
            console.error("[getNotifications] Invalid UUID format:", userId);
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        const { data: notifications, error } = await supabase
            .from('notifications')
            .select(`
                *,
                sender:sender_id (id, name, email)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error("[getNotifications] Supabase query error:", error);
            // Fallback if the join fails (sometimes relationships aren't detected)
            if (error.message.includes('relationship') || ['PGRST200', 'PGRST201'].includes(error.code)) {
                const { data: simpleNotifs, error: simpleError } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (simpleError) throw simpleError;
                return res.json(simpleNotifs);
            }
            return res.status(500).json({ message: 'Database error', error: error.message });
        }
        res.json(notifications);
    } catch (error) {
        console.error("[getNotifications] Catch block error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route PUT /api/notifications/:id/status
const updateStatus = async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    try {
        // Fetch notification first to verify ownership and type
        const { data: notification } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (!notification) return res.status(404).json({ message: 'Notification not found' });

        // Update status in notifications table (stored in both column and data)
        const newData = { ...notification.data, status };
        
        const { data: updated, error: updateError } = await supabase
            .from('notifications')
            .update({ status: status, data: newData, is_read: true })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Handle logical side effects based on type
        if (status === 'accepted' && notification.type === 'guardian_request') {
            const seekerId = notification.sender_id; // The person asking for help
            const guardianId = req.user.id;         // The person who accepted

            // Add recipient (guardian) to sender's (seeker) guardians list
            const { data: seeker } = await supabase
                .from('users')
                .select('guardians')
                .eq('id', seekerId)
                .single();

            const guardians = seeker.guardians || [];
            if (!guardians.includes(guardianId)) {
                guardians.push(guardianId);
                await supabase
                    .from('users')
                    .update({ guardians })
                    .eq('id', seekerId);
                    
                if (global.io) {
                    global.io.to(`user:${seekerId}`).emit('guardian:updated');
                    
                    const { data: acceptNotif } = await supabase.from('notifications').insert({
                        user_id: seekerId,
                        sender_id: guardianId,
                        type: 'guardian_accepted',
                        status: 'unread',
                        data: { message: `${req.user.name} accepted your guardian request` }
                    }).select().single();
                    
                    if (acceptNotif) {
                        global.io.to(`user:${seekerId}`).emit('notification:new', {
                            ...acceptNotif,
                            sender: { id: req.user.id, name: req.user.name, email: req.user.email }
                        });
                    }
                }
            }
        }

        res.json(updated);
    } catch (error) {
        console.error("Update notification error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @route PUT /api/notifications/read-all
const markAllRead = async (req, res) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ status: 'read' })
            .eq('user_id', req.user.id)
            .in('status', ['unread', 'pending']);

        if (error) throw error;

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error("Mark all read error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getNotifications, updateStatus, markAllRead };
