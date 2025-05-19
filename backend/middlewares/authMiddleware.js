// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const config = require('../config/config');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        logger.warn('Token is empty after extraction');
        return res.status(401).json({ error: 'Not authorized, empty token' });
      }
      // Verify token
      const decoded = jwt.verify(token, config.server.jwtSecret);
      // Verify token using the centralized utility
      // const decoded = verifyToken(token);
      // logger.info(
      //   `Token verified successfully, decoded userId: ${
      //     decoded.userId
      //   }, role: ${decoded.role || 'undefined'}`
      // );

      // Debug: Check both collections
      const userInUsersCollection = await firestore
        .collection('users')
        .doc(decoded.userId)
        .get();
      const userInChildrenCollection = await firestore
        .collection('children')
        .doc(decoded.userId)
        .get();

      logger.info(
        `User exists in 'users' collection: ${userInUsersCollection.exists}`
      );
      logger.info(
        `User exists in 'children' collection: ${userInChildrenCollection.exists}`
      );

      // Try to find the user in either collection
      let userDoc = null;
      let collection = '';

      if (decoded.role === 'parent') {
        userDoc = userInUsersCollection;
        collection = 'users';
      } else if (decoded.role === 'child') {
        userDoc = userInChildrenCollection;
        collection = 'children';
      } else {
        // If role is missing or invalid, try both collections
        logger.warn(
          `Role missing or invalid in token: ${decoded.role}, trying both collections`
        );
        if (userInUsersCollection.exists) {
          userDoc = userInUsersCollection;
          collection = 'users';
        } else if (userInChildrenCollection.exists) {
          userDoc = userInChildrenCollection;
          collection = 'children';
        }
      }

      if (!userDoc || !userDoc.exists) {
        logger.warn(`User not found in any collection: ${decoded.userId}`);
        return res
          .status(401)
          .json({ error: 'Not authorized, user not found' });
      }

      // // Get user from database
      // const userSnapshot = await admin
      //   .firestore()
      //   .collection('users')
      //   .doc(decoded.id)
      //   .get();

      // if (!userSnapshot.exists) {
      //   return res.status(401).json({ error: 'User not found' });
      // }

      logger.info(
        `User found in '${collection}' collection: ${decoded.userId}`
      );

      // Determine role based on collection if not in token
      const role =
        decoded.role || (collection === 'children' ? 'child' : 'parent');

      // Add user to request object
      req.user = {
        userId: decoded.userId,
        id: decoded.userId, // For backward compatibility
        role: role,
        ...userDoc.data(),
      };

      next();
    } catch (error) {
      logger.error(`Auth middleware error: ${error.message}`);
      logger.error(`Error name: ${error.name}`);

      if (error.name === 'JsonWebTokenError') {
        if (error.message === 'invalid signature') {
          logger.error(
            'Token signature verification failed. This usually means the token was signed with a different secret than what is being used to verify it.'
          );
        } else if (error.message === 'jwt malformed') {
          logger.error(
            'Token is malformed. This usually means the token string is not in the correct format.'
          );
        }
      } else if (error.name === 'TokenExpiredError') {
        logger.error(`Token has expired. Token expiry: ${error.expiredAt}`);
      }

      res.status(401).json({
        error: 'Not authorized, token failed',
        details: error.message,
      });
    }
  } else {
    logger.warn('No authorization header or not starting with Bearer');
    res.status(401).json({ error: 'Not authorized, no token' });
  }
};

/**
 * Middleware to restrict routes to specific roles
 * @param {...String} roles - Roles allowed to access the route
 * @returns {Function} - Express middleware function
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn(
        `Access denied for user ${req.user?.userId || req.user?.id} with role ${
          req.user?.role
        }. Required roles: ${roles.join(', ')}`
      );
      return res.status(403).json({
        error: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};

/**
 * Middleware to authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    console.log('Authenticating token:', token.substring(0, 10) + '...');
    const decoded = jwt.verify(token, config.server.jwtSecret);
    console.log('Token decoded successfully:', decoded);

    // Ensure consistent property names
    req.user = {
      ...decoded,
      userId: decoded.userId,
      id: decoded.userId, // For backward compatibility
    };

    console.log('User object set on request:', req.user);
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to require parent role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireParentRole = (req, res, next) => {
  if (req.user && req.user.role === 'parent') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Parent role required.' });
  }
};

/**
 * Middleware to require child role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireChildRole = (req, res, next) => {
  if (!req.user || req.user.role !== 'child') {
    return res
      .status(403)
      .json({ error: 'This action requires child privileges' });
  }
  next();
};

module.exports = {
  protect,
  restrictTo,
  authenticateToken,
  requireChildRole,
  requireParentRole,
};
