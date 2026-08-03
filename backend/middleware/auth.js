const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const auth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

            const { data: user, error } = await supabase
                .from('users')
                .select('id, name, email, phone, age, blood_group, health_conditions, skills, lat, lng, guardians, is_active, is_suspended, false_alert_count, trust_score, total_ratings, rating_sum, is_online, last_seen, skill_verification, created_at, is_physically_disabled')
                .eq('id', decoded.id)
                .single();

            if (error || !user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Normalize for backward compat: expose req.user.id and req.user._id
            req.user = { ...user, _id: user.id, location: { lat: user.lat, lng: user.lng } };
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = auth;
