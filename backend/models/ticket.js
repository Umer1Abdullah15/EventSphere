class Ticket {
    constructor(id, eventID, ticketType, price, availability) {
      this.id = id;
      this.eventID = eventID;
      this.ticketType = ticketType;
      this.price = price;
      this.availability = availability;
    }
  
    // Convert raw database object to Ticket model
    static fromDb(dbTicket) {
      return new Ticket(
        dbTicket.id,
        dbTicket.eventID,
        dbTicket.ticketType,
        dbTicket.price,
        dbTicket.availability
      );
    }
  
    // Format price to display format with currency symbol
    getFormattedPrice() {
      return `$${this.price.toFixed(2)}`;
    }
  }
  
  module.exports = Ticket;