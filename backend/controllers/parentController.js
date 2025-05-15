// File: backend/controllers/parentController.js

const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const db = admin.firestore();

const getChildren = async (req, res) => {
  try {
    // Get parent ID from authenticated user
    const parentId = req.user.id;

    if (!parentId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Query children collection for all children with this parentId
    const childrenSnapshot = await db
      .collection('children')
      .where('parentId', '==', parentId)
      .get();

    if (childrenSnapshot.empty) {
      return res.json({ children: [] });
    }

    // Map children documents to response format
    const children = [];
    childrenSnapshot.forEach((doc) => {
      const childData = doc.data();
      children.push({
        id: doc.id,
        name: childData.name,
        age: childData.age,
        jarId: childData.jarId,
        balance: childData.balance || 0,
      });
    });

    res.json({ children });
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({ error: 'Failed to retrieve children accounts' });
  }
};
const getChildDetails = async (req, res) => {
  try {
    // Get parent ID from authenticated user
    const parentId = req.user.id;

    if (!parentId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { childId } = req.params;

    // Get child document
    const childDoc = await db.collection('children').doc(childId).get();

    if (!childDoc.exists) {
      return res.status(404).json({ error: 'Child account not found' });
    }

    const childData = childDoc.data();

    // Verify this child belongs to the authenticated parent
    if (childData.parentId !== parentId) {
      return res.status(403).json({
        error: 'You do not have permission to access this child account',
      });
    }

    // Return child details
    res.json({
      id: childDoc.id,
      name: childData.name,
      age: childData.age,
      jarId: childData.jarId,
      balance: childData.balance || 0,
      createdAt: childData.createdAt,
    });
  } catch (error) {
    console.error('Get child details error:', error);
    res.status(500).json({ error: 'Failed to retrieve child details' });
  }
};
const updateChildDetails = async (req, res) => {
  try {
    // Get parent ID from authenticated user
    const parentId = req.user.id;

    if (!parentId || req.user.role !== 'parent') {
      return res
        .status(401)
        .json({ error: 'Only parents can update child accounts' });
    }

    const { childId } = req.params;
    const { name, age } = req.body;

    // Get child document
    const childDoc = await db.collection('children').doc(childId).get();

    if (!childDoc.exists) {
      return res.status(404).json({ error: 'Child account not found' });
    }

    const childData = childDoc.data();

    // Verify this child belongs to the authenticated parent
    if (childData.parentId !== parentId) {
      return res.status(403).json({
        error: 'You do not have permission to modify this child account',
      });
    }

    // Update fields
    const updateData = {};

    if (name) updateData.name = name;

    if (age) {
      const ageValue = parseInt(age);
      if (isNaN(ageValue) || ageValue <= 0 || ageValue > 18) {
        return res.status(400).json({ error: 'Age must be between 1 and 18' });
      }
      updateData.age = ageValue;
    }

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      await db.collection('children').doc(childId).update(updateData);
    }

    res.json({ message: 'Child account updated successfully' });
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({ error: 'Failed to update child account' });
  }
};
const resetChildPin = async (req, res) => {
  try {
    // Get parent ID from authenticated user
    const parentId = req.user.id;

    if (!parentId || req.user.role !== 'parent') {
      return res
        .status(401)
        .json({ error: 'Only parents can reset child PINs' });
    }

    const { childId } = req.params;
    const { newPin } = req.body;

    if (!newPin) {
      return res.status(400).json({ error: 'New PIN is required' });
    }

    // Validate PIN
    if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
      return res.status(400).json({ error: 'PIN must be 4-6 digits' });
    }

    // Get child document
    const childDoc = await db.collection('children').doc(childId).get();

    if (!childDoc.exists) {
      return res.status(404).json({ error: 'Child account not found' });
    }

    const childData = childDoc.data();

    // Verify this child belongs to the authenticated parent
    if (childData.parentId !== parentId) {
      return res.status(403).json({
        error: 'You do not have permission to modify this child account',
      });
    }

    // Hash the new PIN
    const hashedPin = await bcrypt.hash(newPin, 10);

    // Update child document with new PIN
    await db.collection('children').doc(childId).update({
      hashedPin,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: 'Child PIN reset successfully' });
  } catch (error) {
    console.error('Reset child PIN error:', error);
    res.status(500).json({ error: 'Failed to reset child PIN' });
  }
};

const removeChildAccount = async (req, res) => {
  try {
    // Get parent ID from authenticated user
    const parentId = req.user.id;

    if (!parentId || req.user.role !== 'parent') {
      return res
        .status(401)
        .json({ error: 'Only parents can remove child accounts' });
    }

    const { childId } = req.params;

    // Get child document
    const childDoc = await db.collection('children').doc(childId).get();

    if (!childDoc.exists) {
      return res.status(404).json({ error: 'Child account not found' });
    }

    const childData = childDoc.data();

    // Verify this child belongs to the authenticated parent
    if (childData.parentId !== parentId) {
      return res.status(403).json({
        error: 'You do not have permission to remove this child account',
      });
    }

    // Remove child from parent's children array
    await db
      .collection('users')
      .doc(parentId)
      .update({
        children: admin.firestore.FieldValue.arrayRemove(childId),
      });

    // Delete child document
    await db.collection('children').doc(childId).delete();

    res.json({ message: 'Child account removed successfully' });
  } catch (error) {
    console.error('Remove child error:', error);
    res.status(500).json({ error: 'Failed to remove child account' });
  }
};

module.exports = {
  getChildren,
  getChildDetails,
  updateChildDetails,
  removeChildAccount,
  resetChildPin,
};
