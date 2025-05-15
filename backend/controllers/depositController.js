// Deposit controller handling M-Pesa to Bitcoin conversion
const firebase = require('firebase-admin');
const { initiateMpesaPayment } = require('../services/mpesaService');
const { depositToLNBits } = require('../services/lnbitsService');

/**
 * Process a deposit from M-Pesa to Bitcoin (sats)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const processDeposit = async (req, res) => {
  const { userId } = req.user;
  const { amountKES, jarId } = req.body; // Amount in KES, e.g., 50

  try {
    // Validate user and jar
    const userDoc = await firebase
      .firestore()
      .collection('users')
      .doc(userId)
      .get();
    if (!userDoc.exists || userDoc.data().childProfile.jarId !== jarId) {
      throw new Error('Invalid user or jar ID');
    }

    // Initiate M-Pesa payment
    const mpesaResponse = await initiateMpesaPayment(
      userDoc.data().phoneNumber,
      amountKES,
      jarId
    );
    if (mpesaResponse.status !== 'success')
      throw new Error('M-Pesa payment failed');

    // Mock KES to sats conversion (1 KES = 10 sats)
    // TODO: Replace with actual exchange rate API in production
    const sats = amountKES * 10;

    // Deposit to LNBits wallet
    const walletDoc = await firebase
      .firestore()
      .collection('wallets')
      .doc(userId)
      .get();
    const depositResponse = await depositToLNBits(
      walletDoc.data().lnbitsWalletId,
      sats
    );
    if (!depositResponse.success) throw new Error('Wallet deposit failed');

    // Update Firestore wallet
    await firebase
      .firestore()
      .collection('wallets')
      .doc(userId)
      .update({
        balance: firebase.firestore.FieldValue.increment(sats),
        lastDeposit: {
          amount: sats,
          kesAmount: amountKES,
          timestamp: new Date(),
        },
      });

    res.json({ message: 'Deposit successful', sats, kesAmount: amountKES });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { processDeposit };
