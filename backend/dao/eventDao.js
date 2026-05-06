// backend/dao/eventDao.js
const db = require('../config/db');

class EventDao {
  // Get all events from a specific location
  async getEventsByLocation(location) {
    try {
      const dbConn = await db.openDb();
      const events = await db.all(
        dbConn,
        'SELECT * FROM events WHERE location = ? ORDER BY date',
        [location]
      );
      await db.closeDb(dbConn);
      return events;
    } catch (error) {
      console.error('Error in getEventsByLocation:', error);
      throw error;
    }
  }

  // Get all events (used for map view)
  async getAllEvents() {
    try {
      const dbConn = await db.openDb();
      const events = await db.all(
        dbConn,
        'SELECT * FROM events ORDER BY date',
        []
      );
      await db.closeDb(dbConn);
      return events;
    } catch (error) {
      console.error('Error in getAllEvents:', error);
      throw error;
    }
  }

  // Get a specific event by ID
  async getEventById(eventId) {
    try {
      const dbConn = await db.openDb();
      const event = await db.get(
        dbConn,
        'SELECT * FROM events WHERE id = ?',
        [eventId]
      );
      await db.closeDb(dbConn);
      return event;
    } catch (error) {
      console.error('Error in getEventById:', error);
      throw error;
    }
  }

  // Check if an event has passed (used for booking validation)
  async isEventPassed(eventId) {
    try {
      const dbConn = await db.openDb();
      const event = await db.get(
        dbConn,
        'SELECT date FROM events WHERE id = ?',
        [eventId]
      );
      await db.closeDb(dbConn);
      
      if (!event) return true; // If event not found, consider it passed
      
      // Parse the date from YYMMDD format
      const year = 2000 + parseInt(event.date.substring(0, 2));
      const month = parseInt(event.date.substring(2, 4)) - 1; // JS months are 0-indexed
      const day = parseInt(event.date.substring(4, 6));
      
      const eventDate = new Date(year, month, day);
      const currentDate = new Date();
      
      // Set both dates to midnight for fair comparison
      eventDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);
      
      return eventDate < currentDate;
    } catch (error) {
      console.error('Error in isEventPassed:', error);
      throw error;
    }
  }
}

module.exports = new EventDao();