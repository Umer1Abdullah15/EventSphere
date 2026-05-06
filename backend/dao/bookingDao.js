// backend/dao/bookingDao.js
const db = require('../config/db');

class BookingDao {
  // Create a new booking
  async createBooking(eventId, ticketType, username, quantity) {
    try {
      const dbConn = await db.openDb();
      
      const result = await db.run(
        dbConn,
        'INSERT INTO bookings (eventID, ticketType, username, quantity) VALUES (?, ?, ?, ?)',
        [eventId, ticketType, username, quantity]
      );
      
      await db.closeDb(dbConn);
      return { success: true, bookingId: result.id };
    } catch (error) {
      console.error('Error in createBooking:', error);
      throw error;
    }
  }

  // Get bookings for a specific user
  async getBookingsByUsername(username) {
    try {
      const dbConn = await db.openDb();
      
      const bookings = await db.all(
        dbConn,
        `SELECT b.id, b.eventID, b.ticketType, b.quantity, 
                e.name, e.location, e.date, e.category,
                t.price
         FROM bookings b
         JOIN events e ON b.eventID = e.id
         JOIN tickets t ON b.eventID = t.eventID AND b.ticketType = t.ticketType
         WHERE b.username = ?
         ORDER BY e.date DESC`,
        [username]
      );
      
      await db.closeDb(dbConn);
      return bookings;
    } catch (error) {
      console.error('Error in getBookingsByUsername:', error);
      throw error;
    }
  }
}

module.exports = new BookingDao();