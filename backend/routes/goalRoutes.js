// File: backend/routes/goalRoutes.js

const express = require('express');
const router = express.Router();
const {
  createGoal,
  getGoals,
  getGoal,
  updateGoal,
  deleteGoal,
  approveGoal,
  contributeToGoal,
} = require('../controllers/goalController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Create a new goal
router.post('/', createGoal);

// Get all goals
router.get('/', getGoals);

// Get a specific goal
router.get('/:goalId', getGoal);

// Update a goal
router.put('/:goalId', updateGoal);

// Delete a goal
router.delete('/:goalId', deleteGoal);

// Approve a goal (parent only)
router.post('/:goalId/approve', approveGoal);

// Contribute to a goal
router.post('/:goalId/contribute', contributeToGoal);

module.exports = router;
