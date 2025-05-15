// utils/database.js
const firebase = require('firebase-admin');
const config = require('../config/config');

// Initialize Firebase
let db;
let rtdb;

try {
  // Check if Firebase private key is available
  if (!config.firebase.privateKey) {
    console.error('Firebase private key is missing. Check your .env file.');
    process.exit(1);
  }
  
  const app = firebase.initializeApp({
    credential: firebase.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    }),
    databaseURL: config.firebase.databaseURL,
  });

  console.log('Firebase initialized with project:', config.firebase.projectId);

  // Initialize Firestore
  db = app.firestore();
  db.settings({
    ignoreUndefinedProperties: true,
  });
  // Initialize Realtime Database (if needed)
  rtdb = app.database();
} catch (error) {
  console.error('Error initializing Firebase:', error);
  process.exit(1);
}

// Export the database instances
module.exports = {
  firestore: db,
  // realtimeDb: rtdb,
  admin: firebase,
};

// // Test Firestore connection
// db.collection('test')
//   .doc('connection')
//   .set(
//     {
//       timestamp: new Date(),
//       status: 'connected',
//       test: true,
//     },
//     { merge: true }
//   )
//   .then(() => console.log('Firebase Firestore connection successful'))
//   .catch((error) => {
//     console.error(' Firebase Firestore error:', error.message);
//   });