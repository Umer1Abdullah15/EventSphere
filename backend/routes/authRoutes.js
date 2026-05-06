// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateLogin, validateSignup } = require('../middleware/validation');

// User login
router.post('/login', validateLogin, authController.login);

// User logout
router.post('/logout', authController.logout);

// User signup
router.post('/signup', validateSignup, authController.signup);

// Check authentication status
router.get('/check', authController.checkAuth);

module.exports = router;