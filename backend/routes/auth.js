const express = require('express');
const router = express.Router();
const {
    register,
    login,
    logout,
    refresh,
    getMe,
    changePassword,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);

module.exports = router;
