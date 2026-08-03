const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { respondWelfare } = require('../controllers/welfareController');

router.use(protect);

router.post('/respond', respondWelfare);

module.exports = router;
