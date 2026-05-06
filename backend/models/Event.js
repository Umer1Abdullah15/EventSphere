class Event {
    constructor(id, name, description, location, date, time, category, latitude, longitude) {
      this.id = id;
      this.name = name;
      this.description = description;
      this.location = location;
      this.date = date;
      this.time = time;
      this.category = category;
      this.latitude = latitude;
      this.longitude = longitude;
    }
  
    // Convert raw database object to Event model
    static fromDb(dbEvent) {
      return new Event(
        dbEvent.id,
        dbEvent.name,
        dbEvent.description,
        dbEvent.location,
        dbEvent.date,
        dbEvent.time,
        dbEvent.category,
        dbEvent.latitude,
        dbEvent.longitude
      );
    }
  
    // Format date to display format (assuming date is stored as YYMMDD)
    getFormattedDate() {
      if (!this.date) return '';
      
      const year = 2000 + parseInt(this.date.substring(0, 2));
      const month = parseInt(this.date.substring(2, 4)) - 1;
      const day = parseInt(this.date.substring(4, 6));
      
      const dateObj = new Date(year, month, day);
      return dateObj.toLocaleDateString();
    }
  }
  
  module.exports = Event;