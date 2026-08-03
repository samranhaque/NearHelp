const supabase = require('../config/supabase');

const VALID_SKILLS = [
    'CPR Trained',
    'Medical / First Aid',
    'Firefighting / Fire Safety',
    'Search & Rescue',
    'Mental Health Support',
    'Counselling / Crisis Support',
    'Car / Vehicle Diagnosis',
    'Electrical Emergency',
    'Structural / Civil Emergency',
    'Legal Aid',
    'Child Safety',
    'Elderly Care',
    'Disaster Management',
    'Swimming / Water Rescue',
    'Security / Crowd Control',
    'Food & Shelter Aid',
    'Translation / Language Aid',
    'None',
];

// @route GET /api/users/profile
const getProfile = async (req, res) => {
    try {
        const { data: user } = await supabase.from('users')
            .select('id, name, email, phone, age, blood_group, health_conditions, skills, lat, lng, guardians, trust_score, total_ratings, is_physically_disabled, skill_verification, created_at, false_alert_count, is_suspended')
            .eq('id', req.user.id).single();
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Hydrate guardians
        let guardiansData = [];
        if (user.guardians?.length) {
            const { data: gs } = await supabase.from('users').select('id, name, email, phone').in('id', user.guardians);
            guardiansData = gs || [];
        }
        res.json({ ...user, _id: user.id, location: { lat: user.lat, lng: user.lng }, guardiansData });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route PUT /api/users/profile
const updateProfile = async (req, res) => {
    const { name, phone, age, isPhysicallyDisabled, bloodGroup, healthConditions } = req.body;
    try {
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (phone !== undefined) updates.phone = phone;
        if (age !== undefined) updates.age = parseInt(age) || null;
        if (isPhysicallyDisabled !== undefined) updates.is_physically_disabled = isPhysicallyDisabled;
        if (bloodGroup !== undefined) updates.blood_group = bloodGroup;
        if (healthConditions !== undefined) updates.health_conditions = healthConditions;

        const { data: user } = await supabase.from('users').update(updates).eq('id', req.user.id).select().single();
        res.json({ ...user, _id: user.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route PUT /api/users/skills
const updateSkills = async (req, res) => {
    const { skills } = req.body;
    try {
        if (!Array.isArray(skills)) return res.status(400).json({ message: 'Skills must be an array' });
        const isValid = skills.every(s => VALID_SKILLS.includes(s));
        if (!isValid) return res.status(400).json({ message: 'Invalid skills provided' });

        const { data: user } = await supabase.from('users').update({ skills }).eq('id', req.user.id).select().single();
        res.json({ ...user, _id: user.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route PUT /api/users/location
const updateLocation = async (req, res) => {
    const { lat, lng } = req.body;
    try {
        if (lat === undefined || lng === undefined) return res.status(400).json({ message: 'lat and lng required' });
        const { data: user } = await supabase.from('users')
            .update({
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                is_online: true,
                last_seen: new Date().toISOString()
            })
            .eq('id', req.user.id)
            .select()
            .single();
        res.json({ ...user, _id: user.id, location: { lat: user.lat, lng: user.lng } });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route GET /api/users/guardians
const getGuardians = async (req, res) => {
    try {
        const { data: user, error: userError } = await supabase.from('users').select('guardians').eq('id', req.user.id).single();
        if (userError && userError.code !== 'PGRST116') {
            console.error("getGuardians user fetch error:", userError);
            throw userError;
        }
        
        const guardianIds = user?.guardians || [];
        let accepted = [];
        if (guardianIds.length > 0) {
            const { data: gs, error: gsError } = await supabase.from('users').select('id, name, email, phone').in('id', guardianIds);
            if (gsError) console.error("getGuardians gs fetch error:", gsError);
            accepted = gs || [];
        }

        const { data: pendingNotifs, error: pendingError } = await supabase
            .from('notifications')
            .select('*')
            .eq('sender_id', req.user.id)
            .eq('type', 'guardian_request');

        if (pendingError) {
            console.error("getGuardians pendingNotifs fetch error:", pendingError);
        } else if (pendingNotifs && pendingNotifs.length > 0) {
            console.log("SAMPLE NOTIFICATION:", pendingNotifs[0]);
        }

        // Filter pending locally and ensure we don't include already accepted guardians
        const pendingList = (pendingNotifs || [])
            .filter(n => n.status === 'pending' || n.data?.status === 'pending')
            .filter(n => !guardianIds.includes(n.user_id));
        
        let pending = [];
        if (pendingList.length > 0) {
            const pendingIds = pendingList.map(n => n.user_id);
            const { data: ps, error: psError } = await supabase.from('users').select('id, name, email').in('id', pendingIds);
            if (psError) console.error("getGuardians ps fetch error:", psError);
            pending = ps || [];
        }

        res.json({ accepted, pending });
    } catch (error) {
        console.error("getGuardians unhandled error:", error);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
};

// @route POST /api/users/guardians
const addGuardian = async (req, res) => {
    const { email } = req.body;
    try {
        const { data: guardian } = await supabase.from('users').select('id, name, email, phone').ilike('email', (email || '').trim()).single();
        if (!guardian) return res.status(404).json({ message: 'User with that email not found' });
        if (guardian.id === req.user.id) return res.status(400).json({ message: 'Cannot add yourself as a guardian' });

        const { data: self } = await supabase.from('users').select('name, guardians').eq('id', req.user.id).single();
        const guardians = self?.guardians || [];
        if (guardians.includes(guardian.id)) return res.status(400).json({ message: 'Already a guardian' });

        // Check if a pending request already exists
        const { data: existing } = await supabase.from('notifications')
            .select('id')
            .eq('user_id', guardian.id)
            .eq('sender_id', req.user.id)
            .eq('type', 'guardian_request')
            .eq('status', 'pending')
            .single();

        if (existing) return res.status(400).json({ message: 'Guardian request already pending' });

        // Create notification
        const { data: notification, error: notifError } = await supabase.from('notifications').insert({
            user_id: guardian.id,
            sender_id: req.user.id,
            type: 'guardian_request',
            status: 'pending',
            data: { sender_name: self.name }
        }).select().single();

        if (notifError) throw notifError;

        // Emit socket event for real-time update
        if (global.io) {
            global.io.to(`user:${guardian.id}`).emit('notification:new', {
                ...notification,
                sender: { id: req.user.id, name: self.name, email: req.user.email }
            });
        }

        res.json({ message: 'Guardian request sent', notification });
    } catch (error) {
        console.error("addGuardian unhandled error:", error);
        res.status(500).json({ message: 'Server error', details: error.message || error });
    }
};

// @route DELETE /api/users/guardians/:id
const removeGuardian = async (req, res) => {
    try {
        const { data: self } = await supabase.from('users').select('guardians').eq('id', req.user.id).single();
        const guardians = (self?.guardians || []).filter(g => g !== req.params.id);
        await supabase.from('users').update({ guardians }).eq('id', req.user.id);
        res.json({ message: 'Guardian removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route GET /api/users/nearby
const getNearbyUsers = async (req, res) => {
    try {
        // Prefer query params (passed by frontend with fresh GPS coords), fall back to profile
        const lat = parseFloat(req.query.lat) || req.user.lat;
        const lng = parseFloat(req.query.lng) || req.user.lng;
        const radiusKm = parseFloat(req.query.radius) || 5;

        if (!lat || !lng) return res.status(400).json({ message: 'Location not set. Share your location first.' });

        const { data: users } = await supabase.from('users')
            .select('id, name, skills, trust_score, lat, lng, is_online')
            .eq('is_suspended', false)
            .neq('id', req.user.id);

        const { haversineDistance } = require('../utils/routingEngine');
        const nearby = (users || [])
            .filter(u => u.lat && u.lng && haversineDistance(lat, lng, u.lat, u.lng) <= radiusKm)
            .map(u => ({
                ...u,
                distance: haversineDistance(lat, lng, u.lat, u.lng),
                isOnline: u.is_online,
                trustScore: u.trust_score || 3,
            }))
            .sort((a, b) => a.distance - b.distance);

        res.json(nearby);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getProfile, updateProfile, updateSkills, updateLocation, getGuardians, addGuardian, removeGuardian, getNearbyUsers };
