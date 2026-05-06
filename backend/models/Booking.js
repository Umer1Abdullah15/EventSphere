class Booking {
    constructor(id, eventID, ticketType, username, quantity, eventName, eventLocation, eventDate, eventCategory, ticketPrice) {
      this.id = id;
      this.eventID = eventID;
      this.ticketType = ticketType;
      this.username = username;
      this.quantity = quantity;
      this.eventName = eventName;
      this.eventLocation = eventLocation;
      this.eventDate = eventDate;
      this.eventCategory = eventCategory;
      this.ticketPrice = ticketPrice;
    }
  
    // Convert raw database object to Booking model
    static fromDb(dbBooking) {
      return new Booking(
        dbBooking.id,
        dbBooking.eventID,
        dbBooking.ticketType,
        dbBooking.username,
        dbBooking.quantity,
        dbBooking.name,
        dbBooking.location,
        dbBooking.date,
        dbBooking.category,
        dbBooking.price
      );
    }
  
    // Calculate total price
    getTotalPrice() {
      return this.quantity * this.ticketPrice;
    }
  
    // Format date to display format (assuming date is stored as YYMMDD)
    getFormattedDate() {
      if (!this.eventDate) return '';
      
      const year = 2000 + parseInt(this.eventDate.substring(0, 2));
      const month = parseInt(this.eventDate.substring(2, 4)) - 1;
      const day = parseInt(this.eventDate.substring(4, 6));
      
      const dateObj = new Date(year, month, day);
      return dateObj.toLocaleDateString();
    }
  }
  
  module.exports = Booking;