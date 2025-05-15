// utils/tokenHelper.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('./logger');

/**
 * Generate a JWT token
 * @param {Object} payload - Data to include in the token
 * @param {string} expiresIn - Token expiration time (e.g., '7d', '24h')
 * @returns {string} - JWT token
 */
const generateToken = (payload, expiresIn = '7d') => {
  try {
    logger.info(`Generating token for userId: ${payload.userId}, role: ${payload.role}`);
    const token = jwt.sign(payload, config.server.jwtSecret, { expiresIn });
    return token;
  } catch (error) {
    logger.error(`Token generation error: ${error.message}`);
    throw error;
  }
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.server.jwtSecret);
    logger.info(`Token verified for userId: ${decoded.userId}, role: ${decoded.role || 'undefined'}`);
    console.log('Decoded token payload:', decoded);
    return decoded;
  } catch (error) {
    logger.error(`Token verification error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};