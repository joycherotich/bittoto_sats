const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class MPesaService {
  constructor() {
    console.log('Initializing MPesaService with config:', {
      mpesa: {
        environment: config.mpesa?.environment,
        endpointsExists: !!config.mpesa?.endpoints,
        sandboxBaseUrl: config.mpesa?.endpoints?.sandbox?.baseUrl,
      },
    });

    if (!config.mpesa) {
      throw new Error('M-Pesa configuration missing');
    }

    this.consumerKey = config.mpesa.consumerKey;
    this.consumerSecret = config.mpesa.consumerSecret;
    this.shortCode = config.mpesa.shortCode;
    this.passkey = config.mpesa.passkey;

    const env = config.mpesa.environment || 'sandbox';
    if (!config.mpesa.endpoints || !config.mpesa.endpoints[env]) {
      throw new Error(
        `M-Pesa endpoints not configured for environment: ${env}`
      );
    }

    this.baseUrl = config.mpesa.endpoints[env].baseUrl;
    if (!this.baseUrl) {
      throw new Error('M-Pesa baseUrl not configured');
    }

    console.log('M-Pesa Service Configuration:', {
      environment: env,
      baseUrl: this.baseUrl,
      shortCode: this.shortCode,
      consumerKeyExists: !!this.consumerKey,
      consumerSecretExists: !!this.consumerSecret,
      passkeyExists: !!this.passkey,
    });

    this.accessToken = null;
    this.tokenExpiry = null;
  }

  getTimestamp() {
    const now = new Date();
    return (
      now.getFullYear() +
      ('0' + (now.getMonth() + 1)).slice(-2) +
      ('0' + now.getDate()).slice(-2) +
      ('0' + now.getHours()).slice(-2) +
      ('0' + now.getMinutes()).slice(-2) +
      ('0' + now.getSeconds()).slice(-2)
    );
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      console.log('Using cached M-Pesa access token');
      return this.accessToken;
    }

    try {
      console.log(
        'Getting M-Pesa access token for URL:',
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`
      );

      const auth = Buffer.from(
        `${this.consumerKey}:${this.consumerSecret}`
      ).toString('base64');
      console.log('Auth header created');

      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      console.log('M-Pesa token response:', response.data);

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000 - 60000);
      return this.accessToken;
    } catch (error) {
      console.error(
        'M-Pesa token error details:',
        error.response?.data || error.message
      );
      logger.error('M-Pesa token error:', error.message);
      throw new Error(`Failed to get M-Pesa access token: ${error.message}`);
    }
  }

  async initiateSTKPush(phoneNumber, amount, callbackUrl, accountReference = 'SatsJarJunior') {
    try {
      console.log('Initiating M-Pesa STK Push:', {
        phoneNumber,
        amount,
        callbackUrl,
        accountReference,
      });
      
      // Validate callback URL
      if (!callbackUrl || !callbackUrl.startsWith('http')) {
        // Use a default callback URL from config if not provided or invalid
        callbackUrl = config.server.baseUrl + '/api/payments/mpesa-callback';
        console.log('Using default callback URL:', callbackUrl);
      }

      const token = await this.getAccessToken();
      console.log('Access token obtained');

      const timestamp = this.getTimestamp();
      console.log('Timestamp:', timestamp);

      const cleanPasskey = this.passkey
        ? this.passkey.replace(/['\"]+/g, '')
        : '';
      const password = Buffer.from(
        `${this.shortCode}${cleanPasskey}${timestamp}`
      ).toString('base64');
      console.log('Password generated');

      const payload = {
        BusinessShortCode: this.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: parseInt(amount),
        PartyA: phoneNumber,
        PartyB: this.shortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: 'SatsJar Deposit',
      };

      console.log('STK Push payload:', payload);

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('STK Push response:', response.data);
      return response.data;
    } catch (error) {
      console.error(
        'M-Pesa STK push error details:',
        error.response?.data || error.message
      );
      logger.error('M-Pesa STK push error:', error.message);
      throw new Error(`Failed to initiate M-Pesa payment: ${error.message}`);
    }
  }

  async checkSTKStatus(checkoutRequestId, merchantRequestId) {
    try {
      console.log('Checking M-Pesa STK status:', {
        checkoutRequestId,
        merchantRequestId,
      });

      const token = await this.getAccessToken();
      console.log('Access token obtained for status check');

      const timestamp = this.getTimestamp();
      console.log('Timestamp for status check:', timestamp);

      const cleanPasskey = this.passkey
        ? this.passkey.replace(/['\"]+/g, '')
        : '';
      const password = Buffer.from(
        `${this.shortCode}${cleanPasskey}${timestamp}`
      ).toString('base64');
      console.log('Password generated for status check');

      const payload = {
        BusinessShortCode: this.shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      console.log('STK status check payload:', payload);

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('STK status check response:', response.data);
      return response.data;
    } catch (error) {
      console.error(
        'M-Pesa STK status check error details:',
        error.response?.data || error.message
      );
      logger.error('M-Pesa STK status check error:', error.message);
      throw new Error(`Failed to check M-Pesa payment status: ${error.message}`);
    }
  }
}

module.exports = new MPesaService();