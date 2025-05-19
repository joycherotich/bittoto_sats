// app.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Initialize database early
require('./utils/database');

const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const goalRoutes = require('./routes/goalRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const parentRoutes = require('./routes/parentRoutes');
const educationRoutes = require('./routes/educationRoutes');
const childRoutes = require('./routes/childRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const savingsRoutes = require('./routes/savingsRoutes');

const { errorHandler } = require('./middlewares/errorMiddleware');

// Initialize Express app
const app = express();

// Middleware
app.use(
  cors({
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// JSON parsing with error handling
app.use(
  express.json({
    verify: (req, res, buf, encoding) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        console.error('Invalid JSON in request body:', e.message);
        res
          .status(400)
          .json({ error: 'Invalid JSON in request body', details: e.message });
        throw new Error('Invalid JSON');
      }
    },
  })
);

app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);

  // Log request headers for debugging
  if (req.path.includes('/api/')) {
    console.log('Request headers:', JSON.stringify(req.headers));

    // Log request body for debugging (sanitize sensitive data)
    if (req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.pin) sanitizedBody.pin = '****';
      if (sanitizedBody.password) sanitizedBody.password = '****';
      console.log('Request body:', JSON.stringify(sanitizedBody));
    }
  }

  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Add a lightweight HEAD endpoint handler
app.head('/api', (req, res) => {
  res.status(200).end();
});

// Add a more comprehensive health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/children', childRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/savings', savingsRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use(errorHandler);

// Export the app for server.js to use
// Do not start the server here as it's handled in server.js

module.exports = app;
