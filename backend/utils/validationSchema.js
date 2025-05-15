// utils/validationSchemas.js
const Joi = require('joi');

// Auth schemas
const registerSchema = Joi.object({
  phoneNumber: Joi.string().required(),
  pin: Joi.string().min(4).max(6).required(),
  childName: Joi.string().required(),
  childAge: Joi.number().integer().min(1).max(18).required(),
  jarId: Joi.string().required(),
});

const loginSchema = Joi.object({
  phoneNumber: Joi.string().required(),
  pin: Joi.string().required(),
});

const childAccountSchema = Joi.object({
  childPin: Joi.string().min(4).max(6).required(),
});

// Goal schemas
const createGoalSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  targetAmount: Joi.number().integer().positive().required(),
  imageUrl: Joi.string().uri().allow('', null),
});

const updateGoalSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string().allow('', null),
  targetAmount: Joi.number().integer().positive(),
  imageUrl: Joi.string().uri().allow('', null),
  status: Joi.string().valid('active', 'achieved', 'cancelled'),
});

// Payment schemas
const stkPushSchema = Joi.object({
  phoneNumber: Joi.string().required(),
  amount: Joi.number().positive().required(),
});

// Notification schemas
const notificationSettingsSchema = Joi.object({
  depositNotifications: Joi.boolean(),
  goalAchievementNotifications: Joi.boolean(),
  lowBalanceAlerts: Joi.boolean(),
  lowBalanceThreshold: Joi.number().integer().min(0),
});

const testSmsSchema = Joi.object({
  phoneNumber: Joi.string().required(),
  message: Joi.string().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  childAccountSchema,
  createGoalSchema,
  updateGoalSchema,
  stkPushSchema,
  notificationSettingsSchema,
  testSmsSchema,
};
