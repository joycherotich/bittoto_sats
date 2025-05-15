// File: backend/controllers/goalController.js

const admin = require('firebase-admin');
const db = admin.firestore();

// Create a new goal
const createGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log(`Creating goal for user ${userId} with role ${userRole}`);
    console.log('Request body:', req.body);

    // Get the child ID (either directly for child users or from params for parent users)
    let childId;
    if (userRole === 'child') {
      childId = userId;
      console.log(`Child user, using childId: ${childId}`);
    } else if (userRole === 'parent' && req.body.childId) {
      childId = req.body.childId;
      console.log(`Parent user creating goal for child: ${childId}`);

      // Verify this child belongs to the parent
      const childDoc = await db.collection('children').doc(childId).get();
      if (!childDoc.exists || childDoc.data().parentId !== userId) {
        console.log(`Child ${childId} does not belong to parent ${userId}`);
        return res.status(403).json({
          error: 'You do not have permission to create goals for this child',
        });
      }
    } else if (userRole === 'parent') {
      // If parent is creating a goal without specifying childId, use the first child
      console.log(`Parent user without childId, finding first child`);
      const childrenSnapshot = await db
        .collection('children')
        .where('parentId', '==', userId)
        .limit(1)
        .get();
        
      if (childrenSnapshot.empty) {
        console.log(`No children found for parent ${userId}`);
        return res.status(400).json({ error: 'No children found for this parent' });
      }
      
      childId = childrenSnapshot.docs[0].id;
      console.log(`Using first child: ${childId}`);
    } else {
      console.log('Invalid request: missing childId for parent user');
      return res
        .status(400)
        .json({ error: 'Child ID is required for parent users' });
    }

    const { name, targetAmount, description } = req.body;

    if (!name || !targetAmount) {
      console.log('Missing required fields:', { name, targetAmount });
      return res
        .status(400)
        .json({ error: 'Goal name and target amount are required' });
    }

    // Validate target amount
    const target = parseInt(targetAmount);
    if (isNaN(target) || target <= 0) {
      console.log('Invalid target amount:', targetAmount);
      return res
        .status(400)
        .json({ error: 'Target amount must be a positive number' });
    }

    // child data to associate with the goal
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists) {
      console.log(`Child ${childId} not found`);
      return res.status(404).json({ error: 'Child account not found' });
    }

    const childData = childDoc.data();
    console.log(`Child data:`, { 
      name: childData.name, 
      jarId: childData.jarId,
      parentId: childData.parentId
    });

    // Create the goal
    const goalRef = db.collection('goals').doc();
    const goalData = {
      name,
      targetAmount: target,
      currentAmount: 0,
      description: description || '',
      childId,
      jarId: childData.jarId,
      parentId: childData.parentId,
      approved: userRole === 'parent',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    console.log(`Creating goal with data:`, goalData);
    await goalRef.set(goalData);
    console.log(`Goal created with ID: ${goalRef.id}`);

    res.status(201).json({
      id: goalRef.id,
      ...goalData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
};

// Get all goals for a child
const getGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log(`Getting goals for user ${userId} with role ${userRole}`);

    // Determine which child's goals to fetch
    let childId;
    if (userRole === 'child') {
      childId = userId;
      console.log(`Child user, fetching goals for childId: ${childId}`);
    } else if (userRole === 'parent' && req.query.childId) {
      childId = req.query.childId;
      console.log(`Parent user with childId query param: ${childId}`);

      // Verify this child belongs to the parent
      const childDoc = await db.collection('children').doc(childId).get();
      if (!childDoc.exists || childDoc.data().parentId !== userId) {
        console.log(`Child ${childId} does not belong to parent ${userId}`);
        return res.status(403).json({
          error: 'You do not have permission to view goals for this child',
        });
      }
    } else if (userRole === 'parent') {
      console.log(`Parent user, fetching goals for all children`);
      // If no childId specified, get goals for all children of this parent
      const childrenSnapshot = await db
        .collection('children')
        .where('parentId', '==', userId)
        .get();

      if (childrenSnapshot.empty) {
        console.log(`No children found for parent ${userId}`);
        return res.json([]);
      }

      const childIds = [];
      childrenSnapshot.forEach((doc) => {
        childIds.push(doc.id);
      });
      console.log(`Found ${childIds.length} children for parent ${userId}`);

      // Get goals for all children
      const goalsSnapshot = await db
        .collection('goals')
        .where('parentId', '==', userId)
        .get();

      console.log(`Found ${goalsSnapshot.size} goals for parent ${userId}`);
      
      const goals = [];
      goalsSnapshot.forEach((doc) => {
        const goalData = doc.data();
        goals.push({
          id: doc.id,
          ...goalData,
          createdAt: goalData.createdAt
            ? goalData.createdAt.toDate().toISOString()
            : null,
          updatedAt: goalData.updatedAt
            ? goalData.updatedAt.toDate().toISOString()
            : null,
          progress:
            goalData.targetAmount > 0
              ? (goalData.currentAmount / goalData.targetAmount) * 100
              : 0,
          status: goalData.approved
            ? goalData.currentAmount >= goalData.targetAmount
              ? 'completed'
              : 'approved'
            : 'pending',
        });
      });

      console.log(`Returning ${goals.length} goals for parent ${userId}`);
      return res.json(goals);
    }

    // Get goals for a specific child
    console.log(`Fetching goals for specific child: ${childId}`);
    const goalsSnapshot = await db
      .collection('goals')
      .where('childId', '==', childId)
      .get();

    console.log(`Found ${goalsSnapshot.size} goals for child ${childId}`);
    
    const goals = [];
    goalsSnapshot.forEach((doc) => {
      const goalData = doc.data();
      goals.push({
        id: doc.id,
        ...goalData,
        createdAt: goalData.createdAt
          ? goalData.createdAt.toDate().toISOString()
          : null,
        updatedAt: goalData.updatedAt
          ? goalData.updatedAt.toDate().toISOString()
          : null,
        progress:
          goalData.targetAmount > 0
            ? (goalData.currentAmount / goalData.targetAmount) * 100
            : 0,
        status: goalData.approved
          ? goalData.currentAmount >= goalData.targetAmount
            ? 'completed'
            : 'approved'
          : 'pending',
      });
    });

    console.log(`Returning ${goals.length} goals for child ${childId}`);
    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to retrieve goals' });
  }
};

// Get a specific goal
const getGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { goalId } = req.params;

    // Get the goal
    const goalDoc = await db.collection('goals').doc(goalId).get();

    if (!goalDoc.exists) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goalData = goalDoc.data();

    // Check permissions
    if (userRole === 'child' && goalData.childId !== userId) {
      return res
        .status(403)
        .json({ error: 'You do not have permission to view this goal' });
    }

    if (userRole === 'parent' && goalData.parentId !== userId) {
      return res
        .status(403)
        .json({ error: 'You do not have permission to view this goal' });
    }

    res.json({
      id: goalDoc.id,
      ...goalData,
      createdAt: goalData.createdAt
        ? goalData.createdAt.toDate().toISOString()
        : null,
      updatedAt: goalData.updatedAt
        ? goalData.updatedAt.toDate().toISOString()
        : null,
      progress:
        goalData.targetAmount > 0
          ? (goalData.currentAmount / goalData.targetAmount) * 100
          : 0,
      status: goalData.approved
        ? goalData.currentAmount >= goalData.targetAmount
          ? 'completed'
          : 'approved'
        : 'pending',
    });
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ error: 'Failed to retrieve goal' });
  }
};

// Update a goal
const updateGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { goalId } = req.params;

    // Get the goal
    const goalDoc = await db.collection('goals').doc(goalId).get();

    if (!goalDoc.exists) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goalData = goalDoc.data();

    // Check permissions
    if (userRole === 'child' && goalData.childId !== userId) {
      return res
        .status(403)
        .json({ error: 'You do not have permission to update this goal' });
    }

    if (userRole === 'parent' && goalData.parentId !== userId) {
      return res
        .status(403)
        .json({ error: 'You do not have permission to update this goal' });
    }

    // Update fields
    const { name, targetAmount, description } = req.body;
    const updateData = {};

    if (name) updateData.name = name;

    if (targetAmount) {
      const target = parseInt(targetAmount);
      if (isNaN(target) || target <= 0) {
        return res
          .status(400)
          .json({ error: 'Target amount must be a positive number' });
      }
      updateData.targetAmount = target;
    }

    if (description !== undefined) updateData.description = description;

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      // If parent is updating, auto-approve
      if (userRole === 'parent') {
        updateData.approved = true;
      } else if (
        userRole === 'child' &&
        (name || targetAmount || description !== undefined)
      ) {
        // If child is making significant changes, require re-approval
        updateData.approved = false;
      }

      await db.collection('goals').doc(goalId).update(updateData);
    }

    // Get the updated goal to return to the client
    const updatedGoalDoc = await db.collection('goals').doc(goalId).get();
    const updatedGoalData = updatedGoalDoc.data();

    res.json({
      message: 'Goal updated successfully',
      goal: {
        id: goalId,
        ...updatedGoalData,
        createdAt: updatedGoalData.createdAt
          ? updatedGoalData.createdAt.toDate().toISOString()
          : null,
        updatedAt: updatedGoalData.updatedAt
          ? updatedGoalData.updatedAt.toDate().toISOString()
          : null,
        progress:
          updatedGoalData.targetAmount > 0
            ? (updatedGoalData.currentAmount / updatedGoalData.targetAmount) *
              100
            : 0,
        status: updatedGoalData.approved
          ? updatedGoalData.currentAmount >= updatedGoalData.targetAmount
            ? 'completed'
            : 'approved'
          : 'pending',
      },
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

// Delete a goal
const deleteGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { goalId } = req.params;

    // Get the goal
    const goalDoc = await db.collection('goals').doc(goalId).get();

    if (!goalDoc.exists) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goalData = goalDoc.data();

    // Check permissions
    if (userRole === 'child' && goalData.childId !== userId) {
      return res
        .status(403)
        .json({ error: 'You do not have permission to delete this goal' });
    }

    if (userRole === 'parent' && goalData.parentId !== userId) {
      return res
        .status(403)
        .json({ error: 'You do not have permission to delete this goal' });
    }

    // Delete the goal
    await db.collection('goals').doc(goalId).delete();

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
};

// Approve a goal (parent only)
const approveGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { goalId } = req.params;

    // Only parents can approve goals
    if (userRole !== 'parent') {
      return res.status(403).json({ error: 'Only parents can approve goals' });
    }

    // Get the goal
    const goalDoc = await db.collection('goals').doc(goalId).get();

    if (!goalDoc.exists) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goalData = goalDoc.data();

    // Check if this parent owns the goal
    if (goalData.parentId !== userId) {
      return res
        .status(403)
        .json({ error: 'You do not have permission to approve this goal' });
    }

    // Update the goal
    await db.collection('goals').doc(goalId).update({
      approved: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: 'Goal approved successfully' });
  } catch (error) {
    console.error('Approve goal error:', error);
    res.status(500).json({ error: 'Failed to approve goal' });
  }
};

// Contribute to a goal
const contributeToGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { goalId } = req.params;
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Contribution amount is required' });
    }

    const contributionAmount = parseInt(amount);
    if (isNaN(contributionAmount) || contributionAmount <= 0) {
      return res
        .status(400)
        .json({ error: 'Contribution amount must be a positive number' });
    }

    // Get the goal
    const goalDoc = await db.collection('goals').doc(goalId).get();

    if (!goalDoc.exists) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goalData = goalDoc.data();

    // Check permissions
    if (userRole === 'child' && goalData.childId !== userId) {
      return res.status(403).json({
        error: 'You do not have permission to contribute to this goal',
      });
    }

    if (userRole === 'parent' && goalData.parentId !== userId) {
      return res.status(403).json({
        error: 'You do not have permission to contribute to this goal',
      });
    }

    // Get child's balance
    const childDoc = await db
      .collection('children')
      .doc(goalData.childId)
      .get();
    if (!childDoc.exists) {
      return res.status(404).json({ error: 'Child account not found' });
    }

    const childData = childDoc.data();
    const childBalance = childData.balance || 0;

    // Check if child has enough balance
    if (childBalance < contributionAmount) {
      return res
        .status(400)
        .json({ error: 'Insufficient balance for this contribution' });
    }

    // Check if contribution would exceed the target amount
    const newAmount = goalData.currentAmount + contributionAmount;
    const isGoalCompleted = newAmount >= goalData.targetAmount;

    // Update goal and child balance in a transaction
    await db.runTransaction(async (transaction) => {
      // Update goal
      transaction.update(db.collection('goals').doc(goalId), {
        currentAmount: admin.firestore.FieldValue.increment(contributionAmount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        completed: isGoalCompleted,
      });

      // Update child balance
      transaction.update(db.collection('children').doc(goalData.childId), {
        balance: admin.firestore.FieldValue.increment(-contributionAmount),
      });

      // Record transaction
      const transactionRef = db.collection('transactions').doc();
      transaction.set(transactionRef, {
        type: 'goal_contribution',
        amount: contributionAmount,
        childId: goalData.childId,
        goalId,
        goalName: goalData.name,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // If goal is completed, create a notification
      if (isGoalCompleted) {
        const notificationRef = db.collection('notifications').doc();
        transaction.set(notificationRef, {
          type: 'goal_completed',
          title: 'Goal Completed!',
          message: `Congratulations! You've reached your goal: ${goalData.name}`,
          userId: goalData.childId,
          parentId: goalData.parentId,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    // Get updated goal data
    const updatedGoalDoc = await db.collection('goals').doc(goalId).get();
    const updatedGoalData = updatedGoalDoc.data();

    res.json({
      message: isGoalCompleted
        ? 'Goal completed! Congratulations!'
        : 'Contribution successful',
      goal: {
        id: goalId,
        name: updatedGoalData.name,
        currentAmount: updatedGoalData.currentAmount,
        targetAmount: updatedGoalData.targetAmount,
        progress:
          (updatedGoalData.currentAmount / updatedGoalData.targetAmount) * 100,
        completed: isGoalCompleted,
      },
    });
  } catch (error) {
    console.error('Goal contribution error:', error);
    res.status(500).json({ error: 'Failed to contribute to goal' });
  }
};

module.exports = {
  getGoal,
  getGoals,
  approveGoal,
  deleteGoal,
  createGoal,
  updateGoal,
  contributeToGoal,
};