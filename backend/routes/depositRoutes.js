// Deposit routes
const express = require('express');
const { processDeposit } = require('../controllers/depositController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const router = express.Router();

/**
 * @route POST /api/deposit/process
 * @desc Process a deposit from M-Pesa to Bitcoin
 * @access Private - Requires authentication
 */
router.post('/process', authenticateToken, processDeposit);

module.exports = router;