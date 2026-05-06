const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { isAuthenticated } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validation');

// Ensure the controller functions are defined properly and are valid
// Create a new booking (requires authentication)
router.post('/', isAuthenticated, validateBooking, (req, res) => {
    if (typeof bookingController.createBooking === 'function') {
        bookingController.createBooking(req, res);
    } else {
        console.error('createBooking handler is not a function');
        res.status(500).send('Error: Handler is not a function');
    }
});

// Get bookings for the current user (requires authentication)
router.get('/user', isAuthenticated, (req, res) => {
    if (typeof bookingController.getUserBookings === 'function') {
        bookingController.getUserBookings(req, res);
    } else {
        console.error('getUserBookings handler is not a function');
        res.status(500).send('Error: Handler is not a function');
    }
});

module.exports = router;
