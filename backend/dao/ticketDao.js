// backend/dao/ticketDao.js
const db = require('../config/db');

class TicketDao {
  // Get available tickets for a specific event
  async getTicketsByEventId(eventId) {
    try {
      const dbConn = await db.openDb();
      const tickets = await db.all(
        dbConn,
        'SELECT * FROM tickets WHERE eventID = ? AND availability > 0',
        [eventId]
      );
      await db.closeDb(dbConn);
      return tickets;
    } catch (error) {
      console.error('Error in getTicketsByEventId:', error);
      throw error;
    }
  }

  // Check ticket availability for a specific event and ticket type
  async checkTicketAvailability(eventId, ticketType, quantity) {
    try {
      const dbConn = await db.openDb();
      const ticket = await db.get(
        dbConn,
        'SELECT availability FROM tickets WHERE eventID = ? AND ticketType = ?',
        [eventId, ticketType]
      );
      await db.closeDb(dbConn);
      
      if (!ticket) return false;
      return ticket.availability >= quantity;
    } catch (error) {
      console.error('Error in checkTicketAvailability:', error);
      throw error;
    }
  }

  // Update ticket availability after booking
  async updateTicketAvailability(eventId, ticketType, quantity) {
    try {
      const dbConn = await db.openDb();
      
      // First check if there are enough tickets available
      const ticket = await db.get(
        dbConn,
        'SELECT availability FROM tickets WHERE eventID = ? AND ticketType = ?',
        [eventId, ticketType]
      );
      
      if (!ticket || ticket.availability < quantity) {
        await db.closeDb(dbConn);
        return { success: false, message: 'Not enough tickets available' };
      }
      
      // Update the availability
      await db.run(
        dbConn,
        'UPDATE tickets SET availability = availability - ? WHERE eventID = ? AND ticketType = ?',
        [quantity, eventId, ticketType]
      );
      
      await db.closeDb(dbConn);
      return { success: true };
    } catch (error) {
      console.error('Error in updateTicketAvailability:', error);
      throw error;
    }
  }
}

module.exports = new TicketDao();