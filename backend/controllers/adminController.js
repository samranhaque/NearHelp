const supabase = require('../config/supabase');

// @route GET /api/admin/live-map
const getLiveMapData = async (req, res) => {
    try {
        const { data: activeSOS } = await supabase.from('sos')
            .select('id, type, status, lat, lng, seeker_id, responders, created_at, users!seeker_id(name)')
            .in('status', ['active', 'responding']);
        const { data: onlineUsers } = await supabase.from('users')
            .select('id, name, lat, lng, skills, is_online').eq('is_online', true);
        res.json({ activeSOS: activeSOS || [], onlineUsers: onlineUsers || [] });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route GET /api/admin/analytics
const getAnalytics = async (req, res) => {
    try {
        const { data: allSOS } = await supabase.from('sos').select('*').eq('status', 'resolved');
        const today = new Date(); today.setHours(0, 0, 0, 0);

        const resolvedToday = (allSOS || []).filter(s => s.resolved_at && new Date(s.resolved_at) >= today).length;
        const sosByType = {};
        const typeTimeSums = {};
        const typeTimeCounts = {};
        let totalResponseTime = 0, countWithTime = 0;
        const areaCounts = {};

        (allSOS || []).forEach(sos => {
            sosByType[sos.type] = (sosByType[sos.type] || 0) + 1;
            if (sos.response_time_seconds > 0) {
                totalResponseTime += sos.response_time_seconds;
                countWithTime++;
                typeTimeSums[sos.type] = (typeTimeSums[sos.type] || 0) + sos.response_time_seconds;
                typeTimeCounts[sos.type] = (typeTimeCounts[sos.type] || 0) + 1;
            }
            if (sos.lat && sos.lng) {
                const key = `${sos.lat.toFixed(2)},${sos.lng.toFixed(2)}`;
                areaCounts[key] = (areaCounts[key] || 0) + 1;
            }
        });

        const avgResponseTimeByType = {};
        for (const t in sosByType) {
            avgResponseTimeByType[t] = typeTimeCounts[t] > 0 ? Math.round(typeTimeSums[t] / typeTimeCounts[t]) : 0;
        }

        const topRespondedAreas = Object.keys(areaCounts)
            .map(k => ({ area: k, count: areaCounts[k] }))
            .sort((a, b) => b.count - a.count).slice(0, 10);

        const { data: onlineUsersData } = await supabase.from('users').select('id').eq('is_online', true);
        const onlineUsers = onlineUsersData?.length || 0;

        const { data: flaggedData } = await supabase.from('sos').select('id').eq('is_flagged', true);
        const falseAlertCount = flaggedData?.length || 0;

        res.json({
            totalSOS: allSOS?.length || 0, resolvedToday, sosByType, avgResponseTimeByType,
            avgResponseTime: countWithTime > 0 ? Math.round(totalResponseTime / (countWithTime * 60)) : 0,
            topRespondedAreas, falseAlertCount, onlineUsers
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route GET /api/admin/analytics/heatmap
const getHeatmap = async (req, res) => {
    try {
        const { data: allSOS } = await supabase.from('sos').select('lat, lng, type').not('lat', 'is', null);
        const grid = {};
        (allSOS || []).forEach(sos => {
            const gridX = Math.round(sos.lng * 100) / 100;
            const gridY = Math.round(sos.lat * 100) / 100;
            const key = `${gridX}_${gridY}`;
            if (!grid[key]) grid[key] = { gridX, gridY, count: 0, types: [] };
            grid[key].count++;
            if (!grid[key].types.includes(sos.type)) grid[key].types.push(sos.type);
        });
        res.json(Object.values(grid));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route GET /api/admin/users
const getUsers = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        let query = supabase.from('users').select('id, name, email, skills, trust_score, false_alert_count, is_suspended, created_at, is_active', { count: 'exact' });
        if (status === 'flagged') query = query.gt('false_alert_count', 0);
        else if (status === 'suspended') query = query.eq('is_suspended', true);
        else if (status === 'active') query = query.eq('is_suspended', false);
        query = query.order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
        const { data: users } = await query;
        res.json(users || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route GET /api/admin/users/:id
const getUserById = async (req, res) => {
    try {
        const { data: user } = await supabase.from('users')
            .select('id, name, email, phone, skills, trust_score, false_alert_count, is_suspended, created_at, blood_group')
            .eq('id', req.params.id).single();
        if (!user) return res.status(404).json({ message: 'User not found' });
        const { data: sosHistory } = await supabase.from('sos')
            .select('id, type, status, created_at, resolved_at, seeker_id, responders')
            .or(`seeker_id.eq.${req.params.id},responders.cs.{${req.params.id}}`)
            .order('created_at', { ascending: false });
        res.json({ user, sosHistory: sosHistory || [] });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route POST /api/admin/users/:id/suspend
const suspendUser = async (req, res) => {
    try {
        const { data: user } = await supabase.from('users').update({ is_suspended: true }).eq('id', req.params.id).select().single();
        if (!user) return res.status(404).json({ message: 'User not found' });
        const io = req.app.get('io');
        if (io) io.to(`user:${user.id}`).emit('account:suspended', { reason: 'Admin suspended your account.' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route POST /api/admin/users/:id/unsuspend
const unsuspendUser = async (req, res) => {
    try {
        const { data: user } = await supabase.from('users').update({ is_suspended: false, false_alert_count: 0 }).eq('id', req.params.id).select().single();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route POST /api/admin/users/:id/ban
const banUser = async (req, res) => {
    try {
        const { data: user } = await supabase.from('users').update({ is_suspended: true, is_active: false }).eq('id', req.params.id).select().single();
        const io = req.app.get('io');
        if (io) {
            io.to(`user:${user.id}`).emit('account:banned', { reason: 'Account permanently banned.' });
            io.in(`user:${user.id}`).disconnectSockets(true);
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route GET /api/admin/skills/queue
const getSkillQueue = async (req, res) => {
    try {
        const { data: users } = await supabase.from('users')
            .select('id, name, email, skills, skill_verification, created_at, trust_score')
            .contains('skills', ['Medical / First Aid'])
            .lt('trust_score', 4.0);
        res.json(users || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route POST /api/admin/skills/:userId/verify
const verifySkill = async (req, res) => {
    try {
        const { skill, status } = req.body;
        if (!skill || !['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid skill or status payload' });
        }
        const { data: user } = await supabase.from('users').select('*').eq('id', req.params.userId).single();
        if (!user) return res.status(404).json({ message: 'User not found' });

        const verification = { ...(user.skill_verification || {}), [skill]: status };
        let skills = user.skills || [];
        if (status === 'rejected') skills = skills.filter(s => s !== skill);

        await supabase.from('users').update({ skill_verification: verification, skills }).eq('id', user.id);

        if (status === 'verified') {
            const io = req.app.get('io');
            if (io) io.to(`user:${user.id}`).emit('skill:verified', { skill });
        }
        res.json({ ...user, skill_verification: verification });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route GET /api/admin/welfare
const getWelfareChecks = async (req, res) => {
    try {
        const { data: checks } = await supabase.from('welfare_checks')
            .select('*, users!user_id(name, email), sos!sos_id(type)')
            .eq('sent', true).order('scheduled_for', { ascending: false });
        res.json(checks || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getLiveMapData, getAnalytics, getHeatmap, getUsers, getUserById, suspendUser, unsuspendUser, banUser, getSkillQueue, verifySkill, getWelfareChecks };
