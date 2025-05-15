// controllers/notificationController.js
const { firestore, admin } = require('../utils/database');
const smsService = require('../services/smsService');
const logger = require('../utils/logger');

/**
 * Send a test SMS notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendTestSMS = async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res
        .status(400)
        .json({ error: 'Phone number and message are required' });
    }

    const result = await smsService.sendSMS(phoneNumber, message);

    res.json({
      success: true,
      messageId: result.SMSMessageData.Recipients[0].messageId,
      message: 'Test SMS sent successfully',
    });
  } catch (error) {
    logger.error('Send test SMS error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get notification settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const userDoc = await firestore.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // Get or create notification settings
    let settingsDoc = await firestore
      .collection('notification_settings')
      .doc(userId)
      .get();

    let settings;

    if (!settingsDoc.exists) {
      // Create default settings
      settings = {
        depositNotifications: true,
        goalAchievementNotifications: true,
        lowBalanceAlerts: true,
        lowBalanceThreshold: 1000, // 1000 satoshis
        createdAt: new Date(),
      };

      await firestore
        .collection('notification_settings')
        .doc(userId)
        .set(settings);
    } else {
      settings = settingsDoc.data();
    }

    res.json(settings);
  } catch (error) {
    logger.error('Get notification settings error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update notification settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      depositNotifications,
      goalAchievementNotifications,
      lowBalanceAlerts,
      lowBalanceThreshold,
    } = req.body;

    // Prepare update data
    const updateData = {};
    if (depositNotifications !== undefined)
      updateData.depositNotifications = depositNotifications;
    if (goalAchievementNotifications !== undefined)
      updateData.goalAchievementNotifications = goalAchievementNotifications;
    if (lowBalanceAlerts !== undefined)
      updateData.lowBalanceAlerts = lowBalanceAlerts;
    if (lowBalanceThreshold !== undefined && lowBalanceThreshold >= 0)
      updateData.lowBalanceThreshold = lowBalanceThreshold;

    // Update settings
    await firestore
      .collection('notification_settings')
      .doc(userId)
      .set(updateData, { merge: true });

    res.json({
      ...updateData,
      updatedAt: new Date(),
    });
  } catch (error) {
    logger.error('Update notification settings error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a notification
 * @param {string} userId - User ID to create notification for
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 * @returns {string|null} - Notification ID or null if failed
 */
const createNotification = async (userId, type, data) => {
  try {
    const notificationRef = firestore.collection('notifications').doc();
    await notificationRef.set({
      userId,
      type,
      data,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return notificationRef.id;
  } catch (error) {
    logger.error('Create notification error:', error);
    return null;
  }
};

/**
 * Get notifications for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notificationsSnapshot = await firestore
      .collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const notifications = [];
    notificationsSnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt
          ? doc.data().createdAt.toDate().toISOString()
          : null,
      });
    });

    res.json(notifications);
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
};

/**
 * Mark notifications as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res
        .status(400)
        .json({ error: 'Notification IDs array is required' });
    }

    const batch = firestore.batch();

    // Get each notification and verify ownership
    for (const notificationId of notificationIds) {
      const notificationRef = firestore
        .collection('notifications')
        .doc(notificationId);
      const notificationDoc = await notificationRef.get();

      if (notificationDoc.exists && notificationDoc.data().userId === userId) {
        batch.update(notificationRef, { read: true });
      }
    }

    await batch.commit();

    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    logger.error('Mark notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

module.exports = {
  sendTestSMS,
  createNotification,
  getNotifications,
  markNotificationsRead,
  getNotificationSettings,
  updateNotificationSettings,
};