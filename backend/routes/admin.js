const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const adminGuard = require('../middleware/adminGuard');

const {
    getLiveMapData,
    getAnalytics,
    getHeatmap,
    getUsers,
    getUserById,
    suspendUser,
    unsuspendUser,
    banUser,
    getSkillQueue,
    verifySkill,
    getWelfareChecks
} = require('../controllers/adminController');

// All admin routes must pass BOTH protection layers
router.use(protect);
router.use(adminGuard);

// Live Map
router.get('/live-map', getLiveMapData);

// Analytics
router.get('/analytics', getAnalytics);
router.get('/analytics/heatmap', getHeatmap);

// User Management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.post('/users/:id/suspend', suspendUser);
router.post('/users/:id/unsuspend', unsuspendUser);
router.post('/users/:id/ban', banUser);

// Skill Queue
router.get('/skills/queue', getSkillQueue);
router.post('/skills/:userId/verify', verifySkill);

// Welfare Overview
router.get('/welfare', getWelfareChecks);

module.exports = router;
