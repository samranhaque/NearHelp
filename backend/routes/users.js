const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getProfile,
    updateProfile,
    updateSkills,
    updateLocation,
    getNearbyUsers,
    addGuardian,
    removeGuardian,
    getGuardians,
} = require('../controllers/userController');

router.use(protect);

router.route('/profile').get(getProfile).put(updateProfile);
router.put('/skills', updateSkills);
router.put('/location', updateLocation);
router.get('/nearby', getNearbyUsers);
router.route('/guardians').post(addGuardian).get(getGuardians);
router.delete('/guardians/:id', removeGuardian);

module.exports = router;
