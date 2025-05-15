// File: backend/routes/parentRoutes.js

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
const { authenticateToken } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

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

module.exports = router;