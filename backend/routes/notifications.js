const express = require('express');
const router = express.Router();
const { getNotifications, updateStatus, markAllRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/status', updateStatus);

module.exports = router;
