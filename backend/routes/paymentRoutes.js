// routes/paymentRoutes.js
const express = require('express');
const {
  initiateSTKPush,
  mpesaCallback,
  checkPaymentStatus,
} = require('../controllers/paymentController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public route for M-Pesa callback
router.post('/mpesa-callback', mpesaCallback);

// Protected routes
router.post('/mpesa/stk-push', authenticateToken, initiateSTKPush);
router.post('/child/:childId/mpesa/stk-push', authenticateToken, initiateSTKPush);
router.get('/status/:transactionId', authenticateToken, checkPaymentStatus);

module.exports = router;