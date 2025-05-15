const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { firestore, admin } = require('../utils/database');
const logger = require('../utils/logger');
const { generateToken } = require('../utils/tokenHelper');
const config = require('../config/config');

/**
 * Simple function to hash a PIN
 * @param {string} pin - PIN to hash
 * @returns {string} - Hashed PIN
 */
const hashPin = (pin) => {
  return crypto.createHash('sha256').update(pin).digest('hex');
};

/**
 * Generate a deterministic document ID for a child
 * @param {string} parentId - Parent's ID
 * @param {string} childName - Child's name
 * @returns {string} - A deterministic document ID
 */
const generateChildId = (parentId, childName) => {
  // e a deterministic string that combines parent ID and child name
  const baseString = `${parentId}_${childName
    .toLowerCase()
    .replace(/\s+/g, '_')}`;

  // Create a hash of the base string
  const hash = crypto.createHash('sha256').update(baseString).digest('hex');

  // Return the first 20 characters as the document ID
  return hash.substring(0, 20);
};

/**
 * Generate a user-friendly jar ID (6 characters)
 * @param {string} childName - Child's name
 * @param {string} parentId - Parent's ID
 * @param {number} childAge - Child's age
 * @returns {string} - A 6-character jar ID
 */
const generateJarId = (childName, parentId, childAge) => {
  // Create a deterministic base string using child name, parent ID and age
  const baseString = `${childName
    .toLowerCase()
    .replace(/\s+/g, '_')}_${parentId}_${childAge}`;

  // Create a hash of the base string
  const hash = crypto.createHash('sha256').update(baseString).digest('hex');

  // Take first 6 characters and convert to uppercase for readability
  const jarId = hash.substring(0, 6).toUpperCase();

  return jarId;
};

/**
 * Register a new parent user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const register = async (req, res) => {
  const { phoneNumber, pin } = req.body;
  try {
    if (!phoneNumber || !pin) {
      throw new Error('Phone number and PIN are required');
    }
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      throw new Error('PIN must be exactly 6 digits');
    }
    logger.info(`Registering new parent with phone: ${phoneNumber}`);

    const userRecord = await admin.auth().createUser({
      phoneNumber,
      password: pin,
    });

    const wallet = {
      balance: 0,
      invoiceKey: config.lnbits.invoiceKey, // e07ebecc...
    };

    await firestore
      .collection('users')
      .doc(userRecord.uid)
      .set({
        phoneNumber,
        role: 'parent',
        children: [],
        wallet,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        hashedPin: hashPin(pin),
      });

    const token = generateToken(
      { userId: userRecord.uid, role: 'parent' },
      '7d'
    );

    res.status(201).json({
      token,
      userId: userRecord.uid,
      message: 'Registration successful',
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};
/**
 * Login an existing user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  const { phoneNumber, pin } = req.body;
  try {
    // Validate input
    if (!phoneNumber || !pin) throw new Error('Phone number and PIN required');

    // Validate PIN - must be exactly 6 digits
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      throw new Error('PIN must be exactly 6 digits');
    }

    logger.info(`Login attempt for phone: ${phoneNumber}`);
    const user = await admin.auth().getUserByPhoneNumber(phoneNumber);
    logger.info(`User found in Firebase Auth: ${user.uid}`);

    const userDoc = await firestore.collection('users').doc(user.uid).get();

    if (!userDoc.exists) {
      logger.warn('User not found in Firestore');
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    logger.info('User data retrieved from Firestore');

    if (userData.hashedPin) {
      if (userData.hashedPin !== hashPin(pin)) {
        logger.warn('Invalid PIN provided');
        throw new Error('Invalid credentials');
      }
    } else if (userData.pin !== pin) {
      // Legacy support for plain text PIN
      logger.warn('Invalid legacy PIN provided');
      throw new Error('Invalid credentials');
    }

    logger.info('PIN verification successful');

    // Generate JWT using the centralized utility
    const token = generateToken(
      { userId: user.uid, role: userData.role || 'parent' },
      '7d'
    );

    logger.info('JWT generated successfully');

    res.json({
      token,
      userId: user.uid,
      user: {
        phoneNumber: userData.phoneNumber,
        role: userData.role,
        children: userData.children || [],
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(401).json({ error: error.message });
  }
};

/**
 * Child login function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const childLogin = async (req, res) => {
  try {
    const { jarId, childPin } = req.body;

    if (!jarId || !childPin) {
      return res.status(400).json({ error: 'Jar ID and PIN are required' });
    }

    // Validate PIN - must be exactly 6 digits
    if (childPin.length !== 6 || !/^\d+$/.test(childPin)) {
      return res.status(400).json({ error: 'PIN must be exactly 6 digits' });
    }

    // Find the child document by jar ID
    const childrenSnapshot = await firestore
      .collection('children')
      .where('jarId', '==', jarId.toUpperCase())
      .limit(1)
      .get();

    if (childrenSnapshot.empty) {
      return res.status(404).json({ error: 'Child account not found' });
    }

    const childDoc = childrenSnapshot.docs[0];
    const childData = childDoc.data();
    const childId = childDoc.id;

    console.log('Child document ID:', childId);
    console.log('Child document exists:', childDoc.exists);

    // Verify PIN using bcrypt
    const isPinValid = await bcrypt.compare(childPin, childData.hashedPin);

    if (!isPinValid) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // Get parent data to include necessary information
    const parentDoc = await firestore
      .collection('users')
      .doc(childData.parentId)
      .get();

    if (!parentDoc.exists) {
      return res.status(500).json({ error: 'Parent account not found' });
    }

    // Create JWT token with limited permissions for child
    const token = generateToken(
      {
        userId: childId,
        role: 'child',
        parentId: childData.parentId,
        jarId: childData.jarId,
      },
      '24h'
    );

    console.log(
      'Generated child token with userId:',
      childId,
      'and role: child'
    );
    res.json({
      token,
      userId: childId,
      user: {
        id: childId,
        name: childData.name,
        role: 'child',
        parentId: childData.parentId,
        jarId: childData.jarId,
        balance: childData.balance || 0,
        age: childData.age,
      },
    });
  } catch (error) {
    logger.error(`Child login error: ${error.message}`);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Create a child account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createChildAccount = async (req, res) => {
  try {
    // Get parent ID from authenticated user
    const parentId = req.user.userId || req.user.id;

    if (!parentId || req.user.role !== 'parent') {
      return res
        .status(401)
        .json({ error: 'Only parents can create child accounts' });
    }

    const { childName, childAge, childPin } = req.body;

    if (!childName || !childAge || !childPin) {
      return res
        .status(400)
        .json({ error: 'Child name, age, and PIN are required' });
    }

    const age = parseInt(childAge);
    if (isNaN(age) || age <= 0 || age > 17) {
      return res.status(400).json({ error: 'Age must be between 1 and 17' });
    }

    // Validate PIN - must be exactly 6 digits
    if (childPin.length !== 6 || !/^\d+$/.test(childPin)) {
      return res.status(400).json({ error: 'PIN must be exactly 6 digits' });
    }

    // Generate a deterministic document ID for the child
    const childId = generateChildId(parentId, childName);
    console.log('Generated child ID:', childId);

    const existingChild = await firestore
      .collection('children')
      .doc(childId)
      .get();
    if (existingChild.exists) {
      return res
        .status(400)
        .json({ error: 'A child with this name already exists' });
    }

    // Generate a stable jar ID using child name, parent ID and age
    const jarId = generateJarId(childName, parentId, age);
    console.log('Generated jar ID:', jarId);

    // Check if jarId already exists (very unlikely but possible)
    const existingJar = await firestore
      .collection('children')
      .where('jarId', '==', jarId)
      .limit(1)
      .get();
    let finalJarId = jarId;
    if (!existingJar.empty) {
      finalJarId = jarId.substring(0, 5) + '1';

      // Check if this is also taken
      const secondCheck = await firestore
        .collection('children')
        .where('jarId', '==', finalJarId)
        .limit(1)
        .get();

      if (!secondCheck.empty) {
        // If still taken, use a different suffix
        finalJarId = jarId.substring(0, 5) + '2';
      }
    }

    // Hash the child's PIN
    const hashedPin = await bcrypt.hash(childPin, 10);

    // Initialize wallet with centralized invoiceKey
    const wallet = {
      balance: 0,
      invoiceKey: config.lnbits.invoiceKey, // Use centralized invoiceKey
    };

    // Set the child document data with the deterministic ID
    await firestore.collection('children').doc(childId).set({
      name: childName,
      age,
      parentId,
      jarId: finalJarId,
      hashedPin,
      balance: 0,
      role: 'child',
      wallet, // Add wallet configuration
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update parent document to include reference to this child
    await firestore
      .collection('users')
      .doc(parentId)
      .update({
        children: admin.firestore.FieldValue.arrayUnion(childId),
      });

    res.status(201).json({
      message: 'Child account created successfully',
      childId,
      jarId: finalJarId,
    });
  } catch (error) {
    logger.error(`Create child account error: ${error.message}`);
    res.status(500).json({ error: 'Failed to create child account' });
  }
};

/**
 * Get all users (admin function)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUser = async (req, res) => {
  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    res.json({ message: 'Users', users: listUsersResult.users });
  } catch (error) {
    logger.error(`Get users error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Delete a user (for testing purposes only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteUser = async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    if (!phoneNumber) {
      return res
        .status(400)
        .json({ error: 'Phone number is required in the URL' });
    }

    // Find user by phone number
    const user = await admin.auth().getUserByPhoneNumber(phoneNumber);

    // Delete user from Firebase Auth
    await admin.auth().deleteUser(user.uid);

    // Delete user data from Firestore
    await firestore.collection('users').doc(user.uid).delete();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error(`Delete user error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  createChildAccount,
  deleteUser,
  getUser,
  childLogin,
};
