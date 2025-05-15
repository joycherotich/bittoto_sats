// middlewares/validationMiddleware.js
const Joi = require('joi');

/**
 * Validate request body against a schema
 * @param {Object} schema - Joi schema
 * @returns {Function} - Express middleware function
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};

/**
 * Validate request query against a schema
 * @param {Object} schema - Joi schema
 * @returns {Function} - Express middleware function
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};

/**
 * Validate request params against a schema
 * @param {Object} schema - Joi schema
 * @returns {Function} - Express middleware function
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
};
