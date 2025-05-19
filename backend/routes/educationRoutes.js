const express = require('express');
const router = express.Router();
const {
  getEducationalContent,
  submitQuizAnswers,
  getLearningModules,
  getChildLearningProgress,
  completeLesson,
} = require('../controllers/educationController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Get all educational modules with progress
router.get('/modules', authenticateToken, getLearningModules);

// Get educational content (optionally filtered by category/level)
router.get('/content', authenticateToken, getEducationalContent);

// Submit quiz answers
router.post('/quizzes/submit', authenticateToken, submitQuizAnswers);

// Mark a lesson as completed
router.post('/lessons/:lessonId/complete', authenticateToken, completeLesson);

// Parent route to get child's learning progress
router.get('/progress/:childId', authenticateToken, getChildLearningProgress);

module.exports = router;
