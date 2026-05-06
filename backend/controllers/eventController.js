// backend/controllers/eventController.js
const eventDao = require('../dao/eventDao');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

// Controller for event-related operations
class EventController {
  // Get events by location
  getEventsByLocation = asyncHandler(async (req, res) => {
    const { location } = req.query;
    
    if (!location) {
      throw new ApiError('Location parameter is required', 400);
    }
    
    const events = await eventDao.getEventsByLocation(location);
    res.json({ success: true, events });
  });

  // Get all events (for map view)
  getAllEvents = asyncHandler(async (req, res) => {
    const events = await eventDao.getAllEvents();
    res.json({ success: true, events });
  });

  // Get a specific event by ID
  getEventById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const event = await eventDao.getEventById(id);
    
    if (!event) {
      throw new ApiError('Event not found', 404);
    }
    
    res.json({ success: true, event });
  });
}

module.exports = new EventController();