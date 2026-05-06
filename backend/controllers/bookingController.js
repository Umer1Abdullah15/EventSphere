// backend/controllers/bookingController.js
const bookingDao = require('../dao/bookingDao');
const ticketDao = require('../dao/ticketDao');
const eventDao = require('../dao/eventDao');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

// Controller for booking-related operations
class BookingController {
  // Create a new booking
  createBooking = asyncHandler(async (req, res) => {
    const { eventId, ticketType, quantity } = req.body;
    const username = req.session.user.username;
    
    // Check if the event has passed
    const isPassed = await eventDao.isEventPassed(eventId);
    if (isPassed) {
      throw new ApiError('Cannot book tickets for past events', 400);
    }
    
    // Check ticket availability
    const isAvailable = await ticketDao.checkTicketAvailability(eventId, ticketType, quantity);
    if (!isAvailable) {
      throw new ApiError('Not enough tickets available', 400);
    }
    
    // Update ticket availability
    const updateResult = await ticketDao.updateTicketAvailability(eventId, ticketType, quantity);
    if (!updateResult.success) {
      throw new ApiError(updateResult.message, 400);
    }
    
    // Create booking
    const bookingResult = await bookingDao.createBooking(eventId, ticketType, username, quantity);
    
    res.status(201).json({ 
      success: true, 
      message: 'Booking created successfully', 
      bookingId: bookingResult.bookingId 
    });
  });

  // Get bookings for the current user
  getUserBookings = asyncHandler(async (req, res) => {
    const username = req.session.user.username;
    
    const bookings = await bookingDao.getBookingsByUsername(username);
    
    res.json({ success: true, bookings });
  });
}

module.exports = new BookingController();