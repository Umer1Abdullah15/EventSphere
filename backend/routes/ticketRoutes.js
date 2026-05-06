// backend/routes/ticketRoutes.js
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { validateEventId } = require('../middleware/validation');

// Get tickets for a specific event
router.get('/:id', validateEventId, ticketController.getTicketsByEventId);

module.exports = router;