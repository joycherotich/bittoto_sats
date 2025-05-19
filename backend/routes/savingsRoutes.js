const express = require('express');
const router = express.Router();
const { 
  createSavingsPlan, 
  getSavingsPlans,
  getChildSavingsSummary,
  toggleSavingsPlan
} = require('../controllers/savingsController');
const { 
  authenticateToken 
} = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Create a new savings plan
router.post('/', createSavingsPlan);

// Get all savings plans
router.get('/', getSavingsPlans);

// Child-specific routes
router.get('/summary', getChildSavingsSummary);

// Toggle a savings plan (works for both parent and child)
router.patch('/:planId/toggle', toggleSavingsPlan);

module.exports = router;