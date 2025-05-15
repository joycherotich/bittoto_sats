// services/smsService.js
const AfricasTalking = require('africastalking');
const config = require('../config/config');
const logger = require('../utils/logger');

class SMSService {
  constructor() {
    this.africasTalking = AfricasTalking({
      apiKey: config.sms.apiKey,
      username: config.sms.username,
    });
    this.sms = this.africasTalking.SMS;
  }

  async sendSMS(phoneNumber, message) {
    try {
      // Format phone number if needed (ensure it has country code)
      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      const result = await this.sms.send({
        to: formattedNumber,
        message: message,
        from: 'SatsJar', // Optional sender ID
      });

      logger.info('SMS sent successfully:', result);
      return result;
    } catch (error) {
      logger.error('SMS sending error:', error);
      throw new Error('Failed to send SMS notification');
    }
  }

  formatPhoneNumber(phoneNumber) {
    // Ensure phone number has Kenya country code
    if (phoneNumber.startsWith('0')) {
      return '+254' + phoneNumber.substring(1);
    }
    if (phoneNumber.startsWith('254')) {
      return '+' + phoneNumber;
    }
    if (!phoneNumber.startsWith('+')) {
      return '+' + phoneNumber;
    }
    return phoneNumber;
  }

  async sendDepositNotification(phoneNumber, amount, balance) {
    const message = `Your child's Sats Jar has received a deposit of ${amount} KES. New balance: ${balance} satoshis. Keep stacking sats!`;
    return this.sendSMS(phoneNumber, message);
  }

  async sendGoalAchievedNotification(phoneNumber, goalName) {
    const message = `Congratulations! Your child has achieved their savings goal: "${goalName}". Celebrate this milestone together!`;
    return this.sendSMS(phoneNumber, message);
  }

  async sendLowBalanceAlert(phoneNumber, balance) {
    const message = `Your child's Sats Jar balance is running low: ${balance} satoshis. Consider making a deposit to keep their savings growing.`;
    return this.sendSMS(phoneNumber, message);
  }
}

module.exports = new SMSService();
