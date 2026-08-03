const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

/**
 * Middleware to protect routes using JWT authentication.
 * Verifies the token, fetches the user from Supabase, and attaches it to req.user.
 */
const protect = async (req, res, next) => {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

            // Get user from Supabase
            const { data: user, error } = await supabase
                .from('users')
                .select('id, name, email, phone, age, blood_group, health_conditions, skills, lat, lng, guardians, is_suspended, trust_score')
                .eq('id', decoded.id)
                .single();

            if (error || !user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            if (user.is_suspended) {
                return res.status(403).json({ message: 'Account is suspended' });
            }

            // Attach user to request object (normalized for both id and _id)
            req.user = {
                ...user,
                _id: user.id,
                location: { lat: user.lat, lng: user.lng }
            };

            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

module.exports = { protect };
