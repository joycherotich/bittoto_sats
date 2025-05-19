const express = require('express');
const router = express.Router();
const { getAchievements } = require('../controllers/achievementController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Get achievements (for current user or specified child)
router.get('/', authenticateToken, getAchievements);

module.exports = router;
