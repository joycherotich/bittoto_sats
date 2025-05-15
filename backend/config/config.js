require('dotenv').config();

// Helper function to properly parse Firebase private key
const parseFirebasePrivateKey = () => {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    console.warn('FIREBASE_PRIVATE_KEY is not defined in .env file');
    return undefined;
  }
  // Handle the escaped newlines in the private key
  return privateKey.replace(/\\n/g, '\n');
};

const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    jwtSecret: process.env.JWT_SECRET || 'my_security',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'sats-jar',
    clientEmail:
      process.env.FIREBASE_CLIENT_EMAIL ||
      'firebase-adminsdk-fbsvc@sats-jar.iam.gserviceaccount.com',
    privateKey: parseFirebasePrivateKey(),
    databaseURL:
      process.env.FIREBASE_DATABASE_URL ||
      'https://sats-jar-default-rtdb.firebaseio.com',
  },
  mpesa: {
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    shortCode: process.env.MPESA_SHORTCODE,
    passkey: process.env.MPESA_PASSKEY,
    environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
    endpoints: {
      sandbox: {
        baseUrl: 'https://sandbox.safaricom.co.ke',
        oauth: '/oauth/v1/generate?grant_type=client_credentials',
        stkPush: '/mpesa/stkpush/v1/processrequest',
        stkQuery: '/mpesa/stkpushquery/v1/query',
        accountBalance: '/mpesa/accountbalance/v1/query',
        transactionStatus: '/mpesa/transactionstatus/v1/query',
      },
      production: {
        baseUrl: 'https://api.safaricom.co.ke',
        oauth: '/oauth/v1/generate?grant_type=client_credentials',
        stkPush: '/mpesa/stkpush/v1/processrequest',
        stkQuery: '/mpesa/stkpushquery/v1/query',
        accountBalance: '/mpesa/accountbalance/v1/query',
        transactionStatus: '/mpesa/transactionstatus/v1/query',
      },
    },
  },
  // lnbits: {
  //   baseUrl: process.env.LNBITS_BASE_URL || 'https://demo.lnbits.com/api/v1',
  //   adminKey:
  //     process.env.LNBITS_ADMIN_KEY || 'd9c8289980524ac48c39b6868b77dd08',
  //   invoiceKey:
  //     process.env.LNBITS_INVOICE_KEY || 'e07ebecc0b0f45f9b631b7fc899e22f5',
  //   walletId:
  //     process.env.LNBITS_WALLET_ID || '56968c19adb64a389bc730823f63b116',
  // },
  lnbits: {
    baseUrl: process.env.LNBITS_BASE_URL || 'https://demo.lnbits.com/api/v1',
    adminKey:
      process.env.LNBITS_ADMIN_KEY || 'd9c8289980524ac48c39b6868b77dd08',
    invoiceKey:
      process.env.LNBITS_INVOICE_KEY || 'e07ebecc0b0f45f9b631b7fc899e22f5',
    walletId:
      process.env.LNBITS_WALLET_ID || '56968c19adb64a389bc730823f63b116',
  },
  conversionRates: {
    KES_TO_SATS: process.env.KES_TO_SATS_RATE || 100,
    SATS_TO_KES: process.env.SATS_TO_KES_RATE || 0.01,
  },
  sms: {
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: process.env.AFRICASTALKING_USERNAME || 'sandbox',
    senderId: process.env.AFRICASTALKING_SENDER_ID || 'SatsJar',
    environment: process.env.AFRICASTALKING_ENVIRONMENT || 'sandbox',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIR || 'logs',
  },
  app: {
    minAge: 6,
    maxAge: 14,
    minPinLength: 4,
    maxPinLength: 6,
    defaultLowBalanceThreshold: 100,
    defaultGoalCategories: ['Education', 'Toys', 'Savings', 'Charity', 'Other'],
  },
};

// Debug config
console.log('Config loaded:', {
  mpesaEnvironment: config.mpesa.environment,
  mpesaEndpoints: !!config.mpesa.endpoints,
  mpesaBaseUrl: config.mpesa.endpoints?.sandbox?.baseUrl,
  baseUrl: config.server.baseUrl,
});

module.exports = config;
