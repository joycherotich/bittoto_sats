// routes/authRoutes.js
const express = require('express');
const {
  register,
  login,
  createChildAccount,
  deleteUser,
  getUser,
  childLogin,
} = require('../controllers/authController');
const { protect, authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/child-login', childLogin);

// Protected routes
router.post('/create-child', authenticateToken, createChildAccount);

// Admin routes
router.get('/users', getUser);

// For testing purposes only - remove in production
router.delete('/delete-user/:phoneNumber', deleteUser);

module.exports = router;