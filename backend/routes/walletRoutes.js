// routes/walletRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');

// Import controllers
const walletController = require('../controllers/walletController');

// All routes require authentication
router.use(authenticateToken);

// Get wallet balance
router.get('/balance', walletController.getBalance);

// Get wallet transactions
router.get('/transactions', walletController.getTransactions);

// Create lightning invoice
router.post('/invoice', walletController.createInvoice);

// Check invoice status
router.get('/invoice/:paymentHash', walletController.checkInvoiceStatus);

// Create invoice for child (parent only)
router.post('/child/:childId/invoice', walletController.createChildInvoice);

// Get child's balance (parent only)
router.get('/child/:childId/balance', walletController.getChildBalance);

// Get child's transactions (parent only)
router.get('/child/:childId/transactions', walletController.getChildTransactions);

// Withdraw funds
router.post('/withdraw', walletController.withdraw);

module.exports = router;