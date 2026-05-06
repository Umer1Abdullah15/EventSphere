// backend/middleware/validation.js
const { body, param, validationResult } = require('express-validator');

// Middleware to validate booking requests
const validateBooking = [
  body('eventId')
    .isInt()
    .withMessage('Event ID must be an integer'),
  body('ticketType')
    .isString()
    .notEmpty()
    .withMessage('Ticket type is required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Middleware to validate login requests
const validateLogin = [
  body('username')
    .isString()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .isString()
    .notEmpty()
    .withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Middleware to validate signup requests
const validateSignup = [
  body('username')
    .isString()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  body('password')
    .isString()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Middleware to validate event ID
const validateEventId = [
  param('id')
    .isInt()
    .withMessage('Event ID must be an integer'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateBooking,
  validateLogin,
  validateSignup,
  validateEventId
};