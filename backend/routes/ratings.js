const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    submitRating, 
    submitSeekerRating,
    getResponderRatings,
    getUserRatings 
} = require('../controllers/ratingsController');

// All ratings routes are protected
router.use(protect);

// Seeker rates responder
router.post('/:sosId', submitRating);

// Responder rates seeker
router.post('/:sosId/rate-seeker', submitSeekerRating);

// Get ratings for a specific responder
router.get('/responder/:userId', getResponderRatings);

// Get all ratings for a user (both given and received)
router.get('/user/:userId', getUserRatings);

module.exports = router;
