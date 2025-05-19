const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log the error with request details
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.id,
    userId: req.user?.userId || 'unauthenticated',
  });

  // Determine status code
  const statusCode =
    err.statusCode || res.statusCode !== 200 ? res.statusCode : 500;

  // Sanitize error message in production
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal Server Error'
      : err.message;

  // Send response
  res.status(statusCode).json({
    error: message,
    requestId: req.id,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

// Add request ID middleware
const addRequestId = (req, res, next) => {
  req.id = require('crypto').randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
};

module.exports = { errorHandler, addRequestId };
