const firebase = require('firebase-admin');
const logger = require('./logger');

/**
 * Track user activity for analytics
 * @param {string} userId - User ID
 * @param {string} eventType - Type of event
 * @param {Object} metadata - Additional event data
 */
const trackEvent = async (userId, eventType, metadata = {}) => {
  try {
    await firebase.firestore().collection('analytics').add({
      userId,
      eventType,
      metadata,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.error('Failed to track analytics event', { userId, eventType, error });
  }
};

/**
 * Track system metrics
 * @param {string} metricName - Name of the metric
 * @param {number} value - Metric value
 * @param {Object} tags - Additional tags
 */
const trackMetric = async (metricName, value, tags = {}) => {
  try {
    await firebase.firestore().collection('metrics').add({
      name: metricName,
      value,
      tags,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.error('Failed to track metric', { metricName, value, error });
  }
};

module.exports = { trackEvent, trackMetric };