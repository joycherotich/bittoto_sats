const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');
const qrcode = require('qrcode');

class LNBitsService {
  constructor() {
    this.baseUrl = config.lnbits.baseUrl || 'https://demo.lnbits.com/api/v1';
    this.adminKey = config.lnbits.adminKey;
    this.invoiceKey = config.lnbits.invoiceKey;
    this.walletId = config.lnbits.walletId;

    console.log('LNBits service initialized with centralized wallet');
    console.log('Using baseUrl:', this.baseUrl);
    console.log('Using walletId:', this.walletId);
  }

  async getWalletInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/wallet`, {
        headers: {
          'X-Api-Key': this.invoiceKey,
          'Content-Type': 'application/json',
        },
      });

      return {
        ...response.data,
        adminkey: this.adminKey,
        inkey: this.invoiceKey,
      };
    } catch (error) {
      logger.error('LNBits wallet info error:', error);
      throw new Error(`Failed to get wallet info: ${error.message}`);
    }
  }

  async getWalletBalance() {
    try {
      const response = await axios.get(`${this.baseUrl}/wallet`, {
        headers: {
          'X-Api-Key': this.invoiceKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data.balance;
    } catch (error) {
      logger.error('LNBits balance check error:', error);
      throw new Error(`Failed to get wallet balance: ${error.message}`);
    }
  }

  async createInvoice(invoiceKey, amount, memo) {
    try {
      // Validate amount
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error('Amount must be a positive integer');
      }

      console.log(`Creating invoice for ${amount} sats with memo: ${memo}`);

      // Use provided invoiceKey if available, otherwise fall back to the default
      const apiKey = invoiceKey || this.invoiceKey;
      if (!apiKey) {
        throw new Error('No invoice key provided');
      }

      const response = await axios.post(
        `${this.baseUrl}/payments`,
        {
          out: false,
          amount,
          memo: memo || 'Sats Jar Junior deposit',
        },
        {
          headers: {
            'X-Api-Key': apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Invoice API response:', JSON.stringify(response.data));

      // Generate QR code for the payment request if it exists
      let qrCodeDataURL = null;
      if (response.data?.bolt11) {
        try {
          qrCodeDataURL = await qrcode.toDataURL(response.data.bolt11);
          console.log('QR code generated successfully');
        } catch (qrError) {
          console.error('QR code generation error:', qrError);
          // Continue without QR code
        }
      } else {
        console.warn('No bolt11 in response data');
      }

      return {
        ...response.data,
        payment_request: response.data.bolt11, // Map bolt11 to payment_request
        qrCode: qrCodeDataURL,
      };
    } catch (error) {
      console.error('LNBits invoice creation error:', error.stack);
      logger.error('LNBits invoice creation error:', error);
      throw new Error(
        `Failed to create Lightning invoice: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  }

  async generateQRCode(data) {
    if (!data || typeof data !== 'string') {
      throw new Error('Valid string data required for QR code generation');
    }

    try {
      return await qrcode.toDataURL(data);
    } catch (error) {
      logger.error('QR code generation error:', error);
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  async checkInvoiceStatus(paymentHash) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/payments/${paymentHash}`,
        {
          headers: {
            'X-Api-Key': this.invoiceKey,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error('LNBits invoice status check error:', error);
      throw new Error(`Failed to check invoice status: ${error.message}`);
    }
  }

  async payInvoice(bolt11) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payments`,
        {
          out: true,
          bolt11,
        },
        {
          headers: {
            'X-Api-Key': this.adminKey,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error('LNBits payment error:', error);
      throw new Error(`Failed to pay Lightning invoice: ${error.message}`);
    }
  }
}

module.exports = new LNBitsService();
