// File: backend/controllers/childController.js

const admin = require('firebase-admin');
const db = admin.firestore();

// Get child balance
const getChildBalance = async (req, res) => {
  try {
    const { childId } = req.params;
    const parentId = req.user.id;

    console.log(`Getting balance for child ${childId} by parent ${parentId}`);

    // Verify the child exists and belongs to this parent
    const childDoc = await db.collection('children').doc(childId).get();
    
    if (!childDoc.exists) {
      console.log(`Child ${childId} not found`);
      return res.status(404).json({ error: 'Child not found' });
    }
    
    const childData = childDoc.data();
    
    if (childData.parentId !== parentId) {
      console.log(`Child ${childId} does not belong to parent ${parentId}`);
      return res.status(403).json({ error: 'You do not have permission to access this child' });
    }

    // Return the balance
    const balance = childData.balance || 0;
    console.log(`Child ${childId} balance: ${balance}`);
    
    res.json({ balance });
  } catch (error) {
    console.error('Get child balance error:', error);
    res.status(500).json({ error: 'Failed to retrieve child balance' });
  }
};

module.exports = {
  getChildBalance
};