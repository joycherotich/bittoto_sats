const { firestore } = require('../utils/database');
const lnbitsService = require('../services/lnbitsService');
const logger = require('../utils/logger');

// Get wallet balance
const getBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('Getting balance:', { userId, userRole });

    let balance = 0;
    if (userRole === 'child') {
      const childDoc = await firestore.collection('children').doc(userId).get();
      if (!childDoc.exists) {
        console.error('Child not found:', userId);
        return res.status(404).json({ error: 'Child not found' });
      }
      const childData = childDoc.data();
      balance = childData.balance || 0;
    } else if (userRole === 'parent') {
      const parentDoc = await firestore.collection('users').doc(userId).get();
      if (!parentDoc.exists) {
        console.error('Parent not found:', userId);
        return res.status(404).json({ error: 'Parent not found' });
      }
      const parentData = parentDoc.data();
      balance = parentData.wallet?.balance || 0;
    } else {
      console.error('Invalid role:', userRole);
      return res.status(403).json({ error: 'Invalid user role' });
    }

    res.json({ balance });
  } catch (error) {
    console.error('Get balance error:', error.stack);
    logger.error('Get balance error:', error);
    res
      .status(500)
      .json({ error: 'Failed to get balance', details: error.message });
  }
};

// Create lightning invoice (child only)
const createInvoice = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { amount, memo } = req.body;

    console.log('Creating invoice:', { userId, userRole, amount, memo });

    if (!amount || amount <= 0) {
      console.error('Invalid amount:', amount);
      return res
        .status(400)
        .json({ error: 'Amount must be a positive number' });
    }

    if (userRole !== 'child') {
      console.error('Invalid role for /wallet/invoice:', userRole);
      return res.status(403).json({
        error:
          'Only child users can create invoices. Parents use /api/wallet/child/:childId/invoice.',
      });
    }

    const childDoc = await firestore.collection('children').doc(userId).get();
    if (!childDoc.exists) {
      console.error('Child not found:', userId);
      return res.status(404).json({ error: 'Child not found' });
    }

    const childData = childDoc.data();
    if (!childData.wallet?.invoiceKey) {
      console.error('No invoiceKey found for child:', userId);
      return res.status(400).json({ error: 'Child wallet not configured' });
    }

    const invoice = await lnbitsService.createInvoice(
      childData.wallet.invoiceKey,
      amount,
      memo || `Deposit to ${childData.name}'s wallet`
    );

    const invoiceRef = await firestore.collection('invoices').add({
      userId,
      amount,
      memo: memo || `Deposit to ${childData.name}'s wallet`,
      paymentHash: invoice.payment_hash,
      paymentRequest: invoice.payment_request,
      status: 'pending',
      createdAt: new Date(),
    });

    console.log('Invoice created:', {
      paymentHash: invoice.payment_hash,
      invoiceId: invoiceRef.id,
    });

    res.json({
      paymentHash: invoice.payment_hash,
      paymentRequest: invoice.payment_request,
      amount,
    });
  } catch (error) {
    console.error('Create invoice error:', error.stack);
    logger.error('Create invoice error:', error);
    res
      .status(500)
      .json({ error: 'Failed to create invoice', details: error.message });
  }
};

// Create invoice for child (parent only)
const createChildInvoice = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { childId } = req.params;
    const { amount, memo } = req.body;

    console.log('Creating child invoice:', {
      userId,
      childId,
      userRole,
      amount,
      memo,
    });

    if (userRole !== 'parent') {
      console.error(
        'Non-parent attempted to use /wallet/child/:childId/invoice'
      );
      return res
        .status(403)
        .json({ error: 'Only parents can create child invoices' });
    }

    if (!amount || amount <= 0) {
      console.error('Invalid amount:', amount);
      return res
        .status(400)
        .json({ error: 'Amount must be a positive number' });
    }

    const parentDoc = await firestore.collection('users').doc(userId).get();
    if (!parentDoc.exists) {
      console.error('Parent not found:', userId);
      return res.status(404).json({ error: 'Parent not found' });
    }

    const parentData = parentDoc.data();
    if (!parentData.wallet?.invoiceKey) {
      console.error('No invoiceKey found for parent:', userId);
      return res.status(400).json({ error: 'Parent wallet not configured' });
    }

    const childDoc = await firestore.collection('children').doc(childId).get();
    if (!childDoc.exists) {
      console.error('Child not found:', childId);
      return res.status(404).json({ error: 'Child not found' });
    }

    const childData = childDoc.data();
    if (childData.parentId !== userId) {
      console.error('Child not associated with parent:', {
        childId,
        parentId: userId,
      });
      return res.status(403).json({
        error: 'You do not have permission to create invoices for this child',
      });
    }

    const invoice = await lnbitsService.createInvoice(
      parentData.wallet.invoiceKey,
      amount,
      memo || `Deposit to ${childData.name}'s jar`
    );

    const invoiceRef = await firestore.collection('invoices').add({
      userId: childId,
      parentId: userId,
      amount,
      memo: memo || `Deposit to ${childData.name}'s jar`,
      paymentHash: invoice.payment_hash,
      paymentRequest: invoice.payment_request,
      status: 'pending',
      createdAt: new Date(),
    });

    console.log('Child invoice created:', {
      paymentHash: invoice.payment_hash,
      invoiceId: invoiceRef.id,
    });

    res.json({
      paymentHash: invoice.payment_hash,
      paymentRequest: invoice.payment_request,
      amount,
    });
  } catch (error) {
    console.error('Create child invoice error:', error.stack);
    logger.error('Create child invoice error:', error);
    res.status(500).json({
      error: 'Failed to create invoice for child',
      details: error.message,
    });
  }
};

// Check invoice status
const checkInvoiceStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { paymentHash } = req.params;

    console.log('Checking invoice status:', { userId, userRole, paymentHash });

    const invoicesSnapshot = await firestore
      .collection('invoices')
      .where('paymentHash', '==', paymentHash)
      .limit(1)
      .get();

    if (invoicesSnapshot.empty) {
      console.error('Invoice not found:', paymentHash);
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoiceDoc = invoicesSnapshot.docs[0];
    const invoice = invoiceDoc.data();

    if (invoice.userId !== userId && invoice.parentId !== userId) {
      console.error('Permission denied for invoice:', {
        userId,
        invoiceUserId: invoice.userId,
        invoiceParentId: invoice.parentId,
      });
      return res
        .status(403)
        .json({ error: 'You do not have permission to check this invoice' });
    }

    const status = await lnbitsService.checkInvoiceStatus(paymentHash);

    if (status.paid && invoice.status !== 'paid') {
      await firestore.collection('invoices').doc(invoiceDoc.id).update({
        status: 'paid',
        paidAt: new Date(),
      });

      if (invoice.parentId) {
        await firestore
          .collection('children')
          .doc(invoice.userId)
          .update({
            balance: firestore.FieldValue.increment(invoice.amount),
          });
      } else {
        await firestore
          .collection('children')
          .doc(invoice.userId)
          .update({
            balance: firestore.FieldValue.increment(invoice.amount),
          });
      }

      await firestore.collection('transactions').add({
        userId: invoice.userId,
        parentId: invoice.parentId,
        type: 'deposit',
        source: 'lightning',
        amount: invoice.amount,
        description: invoice.memo,
        paymentHash,
        timestamp: new Date(),
      });
    }

    res.json({
      paid: status.paid,
      amount: invoice.amount,
      memo: invoice.memo,
      createdAt: invoice.createdAt.toDate(),
    });
  } catch (error) {
    console.error('Check invoice status error:', error.stack);
    logger.error('Check invoice status error:', error);
    res.status(500).json({
      error: 'Failed to check invoice status',
      details: error.message,
    });
  }
};

// Get wallet transactions
const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('Getting transactions:', { userId, userRole });

    if (userRole !== 'child' && userRole !== 'parent') {
      console.error('Invalid role:', userRole);
      return res.status(403).json({ error: 'Invalid user role' });
    }

    const transactionsSnapshot = await firestore
      .collection('transactions')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const transactions = [];
    transactionsSnapshot.forEach((doc) => {
      const transaction = doc.data();
      transactions.push({
        id: doc.id,
        ...transaction,
        timestamp: transaction.timestamp.toDate(),
      });
    });

    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error.stack);
    logger.error('Get transactions error:', error);
    res
      .status(500)
      .json({ error: 'Failed to get transactions', details: error.message });
  }
};

// Get child's balance (parent only)
const getChildBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { childId } = req.params;

    console.log('Getting child balance:', { userId, userRole, childId });

    if (userRole !== 'parent') {
      console.error('Non-parent attempted to access child balance');
      return res
        .status(403)
        .json({ error: 'Only parents can access child balances' });
    }

    const childDoc = await firestore.collection('children').doc(childId).get();
    if (!childDoc.exists) {
      console.error('Child not found:', childId);
      return res.status(404).json({ error: 'Child not found' });
    }

    const childData = childDoc.data();
    if (childData.parentId !== userId) {
      console.error('Child not associated with parent:', {
        childId,
        parentId: userId,
      });
      return res
        .status(403)
        .json({ error: 'You do not have permission to access this child' });
    }

    res.json({ balance: childData.balance || 0 });
  } catch (error) {
    console.error('Get child balance error:', error.stack);
    logger.error('Get child balance error:', error);
    res
      .status(500)
      .json({ error: 'Failed to get child balance', details: error.message });
  }
};

// Get child's transactions (parent only)
const getChildTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { childId } = req.params;

    console.log('Getting child transactions:', { userId, userRole, childId });

    if (userRole !== 'parent') {
      console.error('Non-parent attempted to access child transactions');
      return res
        .status(403)
        .json({ error: 'Only parents can access child transactions' });
    }

    const childDoc = await firestore.collection('children').doc(childId).get();
    if (!childDoc.exists) {
      console.error('Child not found:', childId);
      return res.status(404).json({ error: 'Child not found' });
    }

    const childData = childDoc.data();
    if (childData.parentId !== userId) {
      console.error('Child not associated with parent:', {
        childId,
        parentId: userId,
      });
      return res
        .status(403)
        .json({ error: 'You do not have permission to access this child' });
    }

    const transactionsSnapshot = await firestore
      .collection('transactions')
      .where('userId', '==', childId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const transactions = [];
    transactionsSnapshot.forEach((doc) => {
      const transaction = doc.data();
      transactions.push({
        id: doc.id,
        ...transaction,
        timestamp: transaction.timestamp.toDate(),
      });
    });

    res.json(transactions);
  } catch (error) {
    console.error('Get child transactions error:', error.stack);
    logger.error('Get child transactions error:', error);
    res.status(500).json({
      error: 'Failed to get child transactions',
      details: error.message,
    });
  }
};

// Withdraw funds
const withdraw = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { amount, destination } = req.body;

    console.log('Processing withdrawal:', {
      userId,
      userRole,
      amount,
      destination,
    });

    if (!amount || amount <= 0 || !destination) {
      console.error('Invalid withdrawal parameters:', { amount, destination });
      return res.status(400).json({
        error:
          'Amount and destination are required, and amount must be positive',
      });
    }

    let balance = 0;
    let collection;
    if (userRole === 'child') {
      collection = 'children';
      const childDoc = await firestore.collection('children').doc(userId).get();
      if (!childDoc.exists) {
        console.error('Child not found:', userId);
        return res.status(404).json({ error: 'Child not found' });
      }
      const childData = childDoc.data();
      balance = childData.balance || 0;
    } else if (userRole === 'parent') {
      collection = 'users';
      const parentDoc = await firestore.collection('users').doc(userId).get();
      if (!parentDoc.exists) {
        console.error('Parent not found:', userId);
        return res.status(404).json({ error: 'Parent not found' });
      }
      const parentData = parentDoc.data();
      balance = parentData.wallet?.balance || 0;
    } else {
      console.error('Invalid role:', userRole);
      return res.status(403).json({ error: 'Invalid user role' });
    }

    if (balance < amount) {
      console.error('Insufficient balance:', { userId, balance, amount });
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    await firestore.collection('transactions').add({
      userId,
      type: 'withdrawal',
      amount: -amount,
      destination,
      status: 'pending',
      timestamp: new Date(),
    });

    if (userRole === 'child') {
      await firestore
        .collection('children')
        .doc(userId)
        .update({
          balance: firestore.FieldValue.increment(-amount),
        });
    } else {
      await firestore
        .collection('users')
        .doc(userId)
        .update({
          'wallet.balance': firestore.FieldValue.increment(-amount),
        });
    }

    res.json({ success: true, message: 'Withdrawal initiated' });
  } catch (error) {
    console.error('Withdraw error:', error.stack);
    logger.error('Withdraw error:', error);
    res
      .status(500)
      .json({ error: 'Failed to process withdrawal', details: error.message });
  }
};

module.exports = {
  getBalance,
  createInvoice,
  createChildInvoice,
  checkInvoiceStatus,
  getTransactions,
  getChildBalance,
  getChildTransactions,
  withdraw,
};
