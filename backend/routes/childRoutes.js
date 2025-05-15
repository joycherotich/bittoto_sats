// File: backend/routes/childRoutes.js

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { getChildren } = require('../controllers/parentController');

// All routes require authentication
router.use(authenticateToken);

// Get all children for the authenticated parent
router.get('/', getChildren);

module.exports = router;