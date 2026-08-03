const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateAccessToken = (id) => jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
const generateRefreshToken = (id) => jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

// @route POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, phone, age, bloodGroup, healthConditions, skills, isPhysicallyDisabled } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: 'Please add all required fields' });

        const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
        if (existing) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { data: user, error } = await supabase.from('users').insert({
            name, email,
            password: hashedPassword,
            phone: phone || null,
            age: age ? parseInt(age) : null,
            blood_group: bloodGroup || '',
            health_conditions: healthConditions || '',
            skills: Array.isArray(skills) ? skills : [],
            is_physically_disabled: isPhysicallyDisabled || false,
        }).select().single();

        if (error) throw error;

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({ 
            _id: user.id, 
            name: user.name, 
            email: user.email, 
            phone: user.phone, 
            age: user.age,
            blood_group: user.blood_group,
            health_conditions: user.health_conditions,
            is_physically_disabled: user.is_physically_disabled,
            skills: user.skills,
            token: accessToken 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @route POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Please add all required fields' });

        const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });
        if (user.is_suspended) return res.status(403).json({ message: 'Account suspended due to repeated false alerts' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        await supabase.from('users').update({ is_online: true, last_seen: new Date().toISOString() }).eq('id', user.id);

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ 
            _id: user.id, 
            name: user.name, 
            email: user.email, 
            phone: user.phone, 
            age: user.age,
            blood_group: user.blood_group,
            health_conditions: user.health_conditions,
            is_physically_disabled: user.is_physically_disabled,
            skills: user.skills,
            location: { lat: user.lat, lng: user.lng }, 
            token: accessToken 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @route POST /api/auth/logout
const logout = async (req, res) => {
    try {
        if (req.user) {
            await supabase.from('users').update({ is_online: false }).eq('id', req.user.id);
        }
        res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @route POST /api/auth/refresh
const refresh = (req, res) => {
    const refreshToken = req.cookies.jwt;
    if (!refreshToken) return res.status(401).json({ message: 'Not authorized, no token' });
    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const accessToken = generateAccessToken(decoded.id);
        res.json({ token: accessToken });
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, invalid token' });
    }
};

// @route GET /api/auth/me
const getMe = async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @route POST /api/auth/change-password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Please provide current and new passwords' });
        if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });

        const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

        const salt = await bcrypt.genSalt(12);
        const hashed = await bcrypt.hash(newPassword, salt);
        await supabase.from('users').update({ password: hashed }).eq('id', user.id);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { register, login, logout, refresh, getMe, changePassword };
