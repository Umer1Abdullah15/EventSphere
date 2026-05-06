// backend/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { validateEventId } = require('../middleware/validation');

// Get events by location
router.get('/', eventController.getEventsByLocation);

// Get all events (for map view)
router.get('/all', eventController.getAllEvents);

// Get specific event by ID
router.get('/:id', validateEventId, eventController.getEventById);

module.exports = router;