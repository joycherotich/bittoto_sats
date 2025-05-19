// controllers/paymentController.js
const { firestore } = require('../utils/database');
const mpesaService = require('../services/mpesaService');
const lnbitsService = require('../services/lnbitsService');
const smsService = require('../services/smsService');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Format phone number to ensure it starts with 254
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');

  // If it starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }

  // If it doesn't start with 254, add it
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }

  return cleaned;
};

/**
 * Initiate M-Pesa STK Push
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const initiateSTKPush = async (req, res) => {
  try {
    const { phoneNumber, amount } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { childId } = req.params;

    console.log(
      `Initiating M-Pesa payment for user ${userId} with role ${userRole}`
    );
    console.log(
      `Phone: ${phoneNumber}, Amount: ${amount}, ChildId: ${childId || 'none'}`
    );

    if (!phoneNumber || !amount) {
      return res
        .status(400)
        .json({ error: 'Phone number and amount are required' });
    }

    // Validate phone number format
    if (!phoneNumber.match(/^(?:254|\+254|0)\d{9}$/)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Validate amount
    const MIN_AMOUNT = 10; // KES
    const MAX_AMOUNT = 150000; // KES
    if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return res.status(400).json({
        error: `Amount must be between ${MIN_AMOUNT} and ${MAX_AMOUNT} KES`,
      });
    }

    // If this is a parent making a deposit for a child, verify the child belongs to them
    let targetUserId = userId;
    let accountReference = 'SatsJar-default';

    if (childId && userRole === 'parent') {
      console.log(
        `Parent ${userId} attempting to deposit for child ${childId}`
      );

      // Verify child belongs to parent
      const childDoc = await firestore
        .collection('children')
        .doc(childId)
        .get();

      if (!childDoc.exists) {
        return res.status(404).json({ error: 'Child not found' });
      }

      const childData = childDoc.data();

      if (childData.parentId !== userId) {
        return res.status(403).json({
          error: 'You do not have permission to deposit for this child',
        });
      }

      targetUserId = childId;
      accountReference = `SatsJar-${childData.jarId || childId}`;
      console.log(
        `Verified child belongs to parent. Using account reference: ${accountReference}`
      );
    }

    // Check for pending transactions
    const existingTxn = await firestore
      .collection('mpesa_transactions')
      .where('userId', '==', targetUserId)
      .where('status', '==', 'pending')
      .where('createdAt', '>', new Date(Date.now() - 5 * 60 * 1000))
      .get();

    if (!existingTxn.empty) {
      return res.status(400).json({
        error:
          'There is a pending transaction. Please wait 5 minutes before trying again',
      });
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log('Formatted phone number:', formattedPhone);

    // Construct callback URL
    const baseUrl = config.server.baseUrl || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/api/payments/mpesa-callback`;
    console.log('Constructed callback URL:', callbackUrl);

    // Initiate STK Push with timeout
    const TIMEOUT = 60000; // 60 seconds
    const stkPushPromise = mpesaService.initiateSTKPush(
      formattedPhone,
      amount,
      callbackUrl,
      accountReference
    );

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('STK push timeout')), TIMEOUT);
    });

    const result = await Promise.race([stkPushPromise, timeoutPromise]);

    console.log('M-Pesa STK Push result:', result);

    // Store transaction
    const transactionRef = await firestore
      .collection('mpesa_transactions')
      .add({
        userId: targetUserId,
        initiatedBy: userId,
        phoneNumber: formattedPhone,
        amount,
        checkoutRequestId: result.CheckoutRequestID,
        merchantRequestId: result.MerchantRequestID,
        status: 'pending',
        createdAt: new Date(),
      });

    res.json({
      success: true,
      checkoutRequestId: result.CheckoutRequestID,
      transactionId: transactionRef.id,
      message: 'STK push initiated. Please complete the payment on your phone.',
    });
  } catch (error) {
    console.log(error.stack);
    console.error(
      'M-Pesa STK push error details:',
      error.response?.data || error.message
    );
    logger.error('M-Pesa STK push error:', error.message);

    // Send a proper response instead of throwing an error
    res.status(500).json({
      error: error.message || 'Failed to initiate M-Pesa payment',
      details: error.response?.data || {},
    });
  }
};

/**
 * Handle M-Pesa callback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const mpesaCallback = async (req, res) => {
  try {
    console.log('M-Pesa callback received:', req.body);
    const { Body } = req.body;

    // Acknowledge receipt of callback
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    // Process callback asynchronously
    processCallback(Body);
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    logger.error('M-Pesa callback error:', error);
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

/**
 * Process M-Pesa callback
 * @param {Object} callbackData - Callback data from M-Pesa
 */
const processCallback = async (callbackData) => {
  try {
    console.log('Processing M-Pesa callback:', callbackData);
    const { stkCallback } = callbackData;
    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    // Find transaction in Firestore
    const transactionsSnapshot = await firestore
      .collection('mpesa_transactions')
      .where('checkoutRequestId', '==', CheckoutRequestID)
      .limit(1)
      .get();

    if (transactionsSnapshot.empty) {
      logger.error(
        'Transaction not found for CheckoutRequestID:',
        CheckoutRequestID
      );
      return;
    }

    const transactionDoc = transactionsSnapshot.docs[0];
    const transactionId = transactionDoc.id;
    const transaction = transactionDoc.data();

    console.log('Found transaction:', transaction);

    // Update transaction status
    if (ResultCode === 0) {
      // Payment successful
      const { CallbackMetadata } = stkCallback;
      const metadataItems = CallbackMetadata.Item;

      // Extract metadata
      const amount =
        metadataItems.find((item) => item.Name === 'Amount')?.Value || 0;
      const mpesaReceiptNumber =
        metadataItems.find((item) => item.Name === 'MpesaReceiptNumber')
          ?.Value || '';
      const phoneNumber =
        metadataItems.find((item) => item.Name === 'PhoneNumber')?.Value || '';

      console.log('Payment successful:', {
        amount,
        mpesaReceiptNumber,
        phoneNumber,
      });

      // Update transaction
      await firestore
        .collection('mpesa_transactions')
        .doc(transactionId)
        .update({
          status: 'completed',
          mpesaReceiptNumber,
          completedAt: new Date(),
        });

      // Convert KES to satoshis
      const conversionRate = config.conversionRates.KES_TO_SATS || 100; // satoshis per KES
      const satoshis = Math.floor(amount * conversionRate);

      console.log('Converting KES to satoshis:', {
        amount,
        conversionRate,
        satoshis,
      });

      // Determine if this is a child or parent account
      const isChild = transaction.userId !== transaction.initiatedBy;

      // Use a transaction to ensure atomic updates
      const db = firestore;
      await db.runTransaction(async (dbTransaction) => {
        if (isChild) {
          // This is a deposit to a child account
          console.log(`Updating child ${transaction.userId} balance`);

          const childRef = db.collection('children').doc(transaction.userId);
          const childDoc = await dbTransaction.get(childRef);

          if (!childDoc.exists) {
            throw new Error(`Child document ${transaction.userId} not found`);
          }

          const currentBalance = childDoc.data().balance || 0;
          console.log(
            `Current child balance: ${currentBalance}, adding ${satoshis}`
          );

          dbTransaction.update(childRef, {
            balance: currentBalance + satoshis,
          });
        } else {
          // This is a deposit to a parent/user account
          console.log(`Updating user ${transaction.userId} wallet balance`);

          const userRef = db.collection('users').doc(transaction.userId);
          const userDoc = await dbTransaction.get(userRef);

          if (!userDoc.exists) {
            throw new Error(`User document ${transaction.userId} not found`);
          }

          const userData = userDoc.data();
          const currentBalance = userData.wallet?.balance || 0;
          console.log(
            `Current user balance: ${currentBalance}, adding ${satoshis}`
          );

          dbTransaction.update(userRef, {
            'wallet.balance': currentBalance + satoshis,
          });
        }

        // Record transaction in the same atomic operation
        const transactionRef = db.collection('transactions').doc();
        dbTransaction.set(transactionRef, {
          userId: transaction.userId,
          initiatedBy: transaction.initiatedBy,
          type: 'deposit',
          source: 'mpesa',
          amount: satoshis,
          fiatAmount: amount,
          currency: 'KES',
          description: `M-Pesa deposit: ${mpesaReceiptNumber}`,
          mpesaReceiptNumber,
          timestamp: new Date(),
        });
      });

      console.log('Transaction recorded successfully');

      // Try to send SMS notification
      try {
        // Get user's phone number
        const userDoc = await firestore
          .collection('users')
          .doc(transaction.initiatedBy)
          .get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          await smsService.sendDepositNotification(
            userData.phoneNumber,
            amount,
            satoshis
          );
        }
      } catch (smsError) {
        console.error('Failed to send SMS notification:', smsError);
      }

      // Check goals achievement
      try {
        await checkGoalsAchievement(transaction.userId, satoshis);
      } catch (goalError) {
        console.error('Failed to check goals achievement:', goalError);
      }
    } else {
      // Payment failed
      console.log('Payment failed:', ResultDesc);
      await firestore
        .collection('mpesa_transactions')
        .doc(transactionId)
        .update({
          status: 'failed',
          resultCode: ResultCode,
          resultDesc: ResultDesc,
          updatedAt: new Date(),
        });

      logger.error('M-Pesa payment failed:', ResultDesc);
    }
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    logger.error('Error processing M-Pesa callback:', error);
  }
};

/**
 * Check if any savings goals have been achieved
 * @param {string} userId - User ID
 * @param {number} balance - Current wallet balance in satoshis
 */
const checkGoalsAchievement = async (userId, balance) => {
  try {
    // Get user's goals
    const goalsSnapshot = await firestore
      .collection('goals')
      .where('childId', '==', userId)
      .get();

    if (goalsSnapshot.empty) {
      return;
    }

    // Check each goal
    for (const doc of goalsSnapshot.docs) {
      const goal = doc.data();

      // If balance meets or exceeds target
      if (balance >= goal.targetAmount) {
        // Update goal status
        await firestore.collection('goals').doc(doc.id).update({
          status: 'completed',
          achievedAt: new Date(),
        });

        // Create achievement notification
        await firestore.collection('notifications').add({
          userId,
          type: 'goal_achieved',
          title: 'Goal Achieved!',
          message: `You've reached your goal: ${goal.name}`,
          goalId: doc.id,
          read: false,
          createdAt: new Date(),
        });
      }
    }
  } catch (error) {
    logger.error('Error checking goals achievement:', error);
  }
};

/**
 * Check payment status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const checkPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    console.log(
      `Checking payment status for transaction ${transactionId} by user ${userId}`
    );

    // Get transaction
    const transactionDoc = await firestore
      .collection('mpesa_transactions')
      .doc(transactionId)
      .get();

    if (!transactionDoc.exists) {
      console.log(`Transaction ${transactionId} not found`);
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactionDoc.data();
    console.log('Transaction data:', transaction);

    // Check if transaction belongs to user or was initiated by user
    if (transaction.userId !== userId && transaction.initiatedBy !== userId) {
      console.log(
        `Transaction ${transactionId} does not belong to user ${userId}`
      );
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Return status
    res.json({
      status: transaction.status,
      completed: transaction.status === 'completed',
      amount: transaction.amount,
      timestamp: transaction.createdAt.toDate(),
      ...(transaction.mpesaReceiptNumber && {
        mpesaReceiptNumber: transaction.mpesaReceiptNumber,
      }),
    });
  } catch (error) {
    console.error('Check payment status error:', error);
    logger.error('Check payment status error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  initiateSTKPush,
  mpesaCallback,
  checkPaymentStatus,
};
