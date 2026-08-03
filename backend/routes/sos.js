const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getChatReply } = require('../services/keywordEngine');
const {
    createSOS,
    createAnonymousSOS,
    getActiveSOS,
    getSOSStats,
    getGlobalStats,
    getSOSById,
    respondToSOS,
    resolveSOS,
    flagSOS,
    getSOSHistory,
    confirmPresence
} = require('../controllers/sosController');

// Anonymous — no auth required
router.post('/anonymous', createAnonymousSOS);

// Keyword AI chat assist — synchronous, no auth needed
router.post('/chat-assist', (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: '' });
    const reply = getChatReply(message);
    res.json({ reply });
});

// Protected routes
router.post('/chat', protect, require('../controllers/sosController').handleAIChat);
router.post('/create', protect, createSOS);
router.get('/me/active', protect, require('../controllers/sosController').getMyActiveSOS);
router.get('/active', protect, getActiveSOS);
router.get('/stats', protect, getSOSStats);
router.get('/global-stats', protect, getGlobalStats);
router.get('/history', protect, getSOSHistory);
router.get('/:id', protect, getSOSById);
router.post('/:id/respond', protect, respondToSOS);
router.post('/:id/resolve', protect, resolveSOS);
router.post('/:id/flag', protect, flagSOS);
router.post('/:id/presence', protect, confirmPresence);

module.exports = router;
