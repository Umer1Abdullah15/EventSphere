// backend/controllers/ticketController.js
const ticketDao = require('../dao/ticketDao');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

// Controller for ticket-related operations
class TicketController {
  // Get tickets for a specific event
  getTicketsByEventId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const tickets = await ticketDao.getTicketsByEventId(id);
    
    if (!tickets || tickets.length === 0) {
      throw new ApiError('No tickets available for this event', 404);
    }
    
    res.json({ success: true, tickets });
  });
}

module.exports = new TicketController();