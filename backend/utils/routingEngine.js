const supabase = require('../config/supabase');

const haversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const SKILL_MAP = {
    // Medical & Health
    'Medical': ['CPR Trained', 'Medical / First Aid'],
    'Mental Health Crisis': ['Mental Health Support', 'Counselling / Crisis Support'],
    'Elderly Care': ['Elderly Care', 'Medical / First Aid', 'CPR Trained'],

    // Fire & Rescue
    'Fire': ['Firefighting / Fire Safety'],
    'Flood / Water': ['Swimming / Water Rescue', 'Search & Rescue', 'Disaster Management'],
    'Structural Collapse': ['Search & Rescue', 'Structural / Civil Emergency', 'Disaster Management'],
    'Pet Rescue': ['Search & Rescue', 'Swimming / Water Rescue'],

    // Vehicle & Technical
    'Car Problem': ['Car / Vehicle Diagnosis'],
    'Gas Leak': ['Electrical Emergency', 'Firefighting / Fire Safety'],
    'Electrical': ['Electrical Emergency'],

    // People & Safety
    'Child in Danger': ['Child Safety', 'Medical / First Aid', 'CPR Trained'],
    'Threat to Safety': ['Security / Crowd Control', 'Search & Rescue'],
    'Legal Emergency': ['Legal Aid'],

    // Humanitarian
    'Food / Shelter': ['Food & Shelter Aid', 'Disaster Management'],

    // General — pings everyone nearby
    'General Help': [],
};

const getUsersInRadius = async (sosLocation, radiusKm, filters = {}) => {
    const { seekerId, type, isAnonymous } = filters;

    // Fetch targeted users: online OR seen in last 10 mins, non-suspended
    const tenMinsAgo = new Date(Date.now() - 10 * 60000).toISOString();

    const { data: users } = await supabase
        .from('users')
        .select('id, lat, lng, skills, age, is_physically_disabled, guardians, last_seen, is_online')
        .or(`is_online.eq.true,last_seen.gte.${tenMinsAgo}`)
        .eq('is_suspended', false);

    if (!users) return { priority: [], general: [], guardians: [] };

    // ... (rest of guardian logic) ...
    let guardianIds = [];
    if (seekerId && !isAnonymous) {
        const { data: seeker } = await supabase.from('users').select('guardians').eq('id', seekerId).single();
        if (seeker?.guardians?.length) {
            guardianIds = seeker.guardians;
        }
    }

    const priority = [];
    const general = [];
    const prioritySkills = SKILL_MAP[type] || [];

    users.forEach(user => {
        if (user.id === seekerId) return; // never ping the seeker themselves
        if (!user.lat || !user.lng) return;

        const distance = haversineDistance(sosLocation.lat, sosLocation.lng, user.lat, user.lng);
        if (distance > radiusKm) return;

        if (type === 'Threat to Safety' || type === 'Threat') {
            if (user.age >= 18 && user.age <= 40 && user.is_physically_disabled === false) {
                general.push(user.id);
            }
        } else if (prioritySkills.length > 0) {
            const hasSkill = (user.skills || []).some(s => prioritySkills.includes(s));
            if (hasSkill) {
                priority.push(user.id);
            } else {
                general.push(user.id);
            }
        } else {
            general.push(user.id);
        }
    });

    return { priority, general, guardians: guardianIds };
};

module.exports = { haversineDistance, getUsersInRadius };
