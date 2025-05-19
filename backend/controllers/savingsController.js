// New file: backend/controllers/savingsController.js

const admin = require('firebase-admin');
const db = admin.firestore();
const { createNotification } = require('./notificationController');

// Create a savings plan
const createSavingsPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get the child ID (either directly for child users or from params for parent users)
    let childId;
    if (userRole === 'child') {
      childId = userId;
    } else if (userRole === 'parent' && req.body.childId) {
      childId = req.body.childId;

      // Verify this child belongs to the parent
      const childDoc = await db.collection('children').doc(childId).get();
      if (!childDoc.exists || childDoc.data().parentId !== userId) {
        return res.status(403).json({
          error:
            'You do not have permission to create savings plans for this child',
        });
      }
    } else {
      return res
        .status(400)
        .json({ error: 'Child ID is required for parent users' });
    }

    const { name, frequency, amount, goalId } = req.body;

    if (!name || !frequency || !amount) {
      return res
        .status(400)
        .json({ error: 'Plan name, frequency, and amount are required' });
    }

    // Validate amount
    const savingsAmount = parseInt(amount);
    if (isNaN(savingsAmount) || savingsAmount <= 0) {
      return res
        .status(400)
        .json({ error: 'Amount must be a positive number' });
    }

    // Validate frequency
    const validFrequencies = ['daily', 'weekly', 'monthly'];
    if (!validFrequencies.includes(frequency)) {
      return res
        .status(400)
        .json({ error: 'Frequency must be daily, weekly, or monthly' });
    }

    // If goalId is provided, verify it exists and belongs to the child
    if (goalId) {
      const goalDoc = await db.collection('goals').doc(goalId).get();
      if (!goalDoc.exists || goalDoc.data().childId !== childId) {
        return res.status(400).json({ error: 'Invalid goal ID' });
      }
    }

    // Create the savings plan
    const planRef = db.collection('savings_plans').doc();
    const planData = {
      name,
      frequency,
      amount: savingsAmount,
      childId,
      goalId: goalId || null,
      active: true,
      createdBy: userRole,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastExecuted: null,
      nextExecution: calculateNextExecution(frequency),
    };

    await planRef.set(planData);

    // Notify the other party
    if (userRole === 'parent') {
      await createNotification(childId, 'savings_plan_created', {
        planId: planRef.id,
        planName: name,
        amount: savingsAmount,
        frequency,
      });
    } else {
      const childDoc = await db.collection('children').doc(childId).get();
      const parentId = childDoc.data().parentId;
      await createNotification(parentId, 'savings_plan_created', {
        childId,
        planId: planRef.id,
        planName: name,
        amount: savingsAmount,
        frequency,
      });
    }

    res.status(201).json({
      id: planRef.id,
      ...planData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextExecution: planData.nextExecution.toISOString(),
    });
  } catch (error) {
    console.error('Create savings plan error:', error);
    res.status(500).json({ error: 'Failed to create savings plan' });
  }
};

// Calculate next execution date based on frequency
const calculateNextExecution = (frequency) => {
  const now = new Date();

  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
  }

  return now;
};

// Get savings plans
const getSavingsPlans = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Determine which child's plans to fetch
    let childId;
    if (userRole === 'child') {
      childId = userId;
    } else if (userRole === 'parent' && req.query.childId) {
      childId = req.query.childId;

      // Verify this child belongs to the parent
      const childDoc = await db.collection('children').doc(childId).get();
      if (!childDoc.exists || childDoc.data().parentId !== userId) {
        return res.status(403).json({
          error:
            'You do not have permission to view savings plans for this child',
        });
      }
    } else if (userRole === 'parent') {
      // If no childId specified, get plans for all children of this parent
      const childrenSnapshot = await db
        .collection('children')
        .where('parentId', '==', userId)
        .get();

      if (childrenSnapshot.empty) {
        return res.json([]);
      }

      const childIds = [];
      childrenSnapshot.forEach((doc) => {
        childIds.push(doc.id);
      });

      // Get plans for all children
      const plansSnapshot = await db
        .collection('savings_plans')
        .where('childId', 'in', childIds)
        .get();

      const plans = [];
      plansSnapshot.forEach((doc) => {
        plans.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt
            ? doc.data().createdAt.toDate().toISOString()
            : null,
          updatedAt: doc.data().updatedAt
            ? doc.data().updatedAt.toDate().toISOString()
            : null,
          lastExecuted: doc.data().lastExecuted
            ? doc.data().lastExecuted.toDate().toISOString()
            : null,
          nextExecution: doc.data().nextExecution
            ? doc.data().nextExecution.toDate().toISOString()
            : null,
        });
      });

      return res.json(plans);
    }

    // Get plans for a specific child
    const plansSnapshot = await db
      .collection('savings_plans')
      .where('childId', '==', childId)
      .get();

    const plans = [];
    plansSnapshot.forEach((doc) => {
      plans.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt
          ? doc.data().createdAt.toDate().toISOString()
          : null,
        updatedAt: doc.data().updatedAt
          ? doc.data().updatedAt.toDate().toISOString()
          : null,
        lastExecuted: doc.data().lastExecuted
          ? doc.data().lastExecuted.toDate().toISOString()
          : null,
        nextExecution: doc.data().nextExecution
          ? doc.data().nextExecution.toDate().toISOString()
          : null,
      });
    });

    res.json(plans);
  } catch (error) {
    console.error('Get savings plans error:', error);
    res.status(500).json({ error: 'Failed to retrieve savings plans' });
  }
};

// Get savings summary for a child
const getChildSavingsSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'child') {
      return res
        .status(403)
        .json({ error: 'This endpoint is for child users only' });
    }

    // Get all active savings plans for this child
    const plansSnapshot = await db
      .collection('savings_plans')
      .where('childId', '==', userId)
      .where('active', '==', true)
      .get();

    // Calculate total saved amount
    let totalSaved = 0;
    const plans = [];

    plansSnapshot.forEach((doc) => {
      const planData = doc.data();
      plans.push({
        id: doc.id,
        name: planData.name,
        frequency: planData.frequency,
        amount: planData.amount,
        nextExecution: planData.nextExecution
          ? planData.nextExecution.toDate().toISOString()
          : null,
      });

      // Add to total if there's a lastExecuted date
      if (planData.lastExecuted) {
        totalSaved += planData.amount;
      }
    });

    res.json({
      totalSaved,
      activePlans: plans.length,
      plans,
    });
  } catch (error) {
    console.error('Get child savings summary error:', error);
    res.status(500).json({ error: 'Failed to retrieve savings summary' });
  }
};

// Toggle a savings plan (enable/disable)
const toggleSavingsPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { planId } = req.params;

    // Get the savings plan
    const planDoc = await db.collection('savings_plans').doc(planId).get();

    if (!planDoc.exists) {
      return res.status(404).json({ error: 'Savings plan not found' });
    }

    const planData = planDoc.data();

    // Check permissions
    if (userRole === 'child' && planData.childId !== userId) {
      return res
        .status(403)
        .json({
          error: 'You do not have permission to modify this savings plan',
        });
    }

    // Toggle the active status
    const newActiveStatus = !planData.active;

    await db.collection('savings_plans').doc(planId).update({
      active: newActiveStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      id: planId,
      active: newActiveStatus,
      message: `Savings plan ${
        newActiveStatus ? 'activated' : 'paused'
      } successfully`,
    });
  } catch (error) {
    console.error('Toggle savings plan error:', error);
    res.status(500).json({ error: 'Failed to update savings plan' });
  }
};

module.exports = {
  createSavingsPlan,
  getSavingsPlans,
  getChildSavingsSummary,
  toggleSavingsPlan,
  // Include any other existing functions here
};
