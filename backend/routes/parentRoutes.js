const express = require('express');
const router = express.Router();

const {
  getChildren,
  getChildDetails,
  updateChildDetails,
  removeChildAccount,
  resetChildPin,
} = require('../controllers/parentController');
const { getChildBalance } = require('../controllers/childController');
const {
  authenticateToken,
  requireParentRole,
} = require('../middlewares/authMiddleware');
const {
  getChildLearningProgress,
} = require('../controllers/educationController');
const { getAchievements } = require('../controllers/achievementController');

// Apply parent role middleware to all routes
router.use(authenticateToken);
router.use(requireParentRole);

// Get all children for the authenticated parent
router.get('/children', getChildren);

// Get details for a specific child
router.get('/children/:childId', getChildDetails);

// Get balance for a specific child
router.get('/children/:childId/balance', getChildBalance);

// Update child details
router.put('/children/:childId', updateChildDetails);

// Remove a child account
router.delete('/children/:childId', removeChildAccount);

// Reset a child's PIN
router.post('/children/:childId/reset-pin', resetChildPin);

// Get child's learning progress
router.get('/children/:childId/education/progress', getChildLearningProgress);

// Get child's achievements
router.get('/children/:childId/achievements', (req, res) => {
  // Set childId in query params for the getAchievements function
  req.query.childId = req.params.childId;
  getAchievements(req, res);
});

module.exports = router;
