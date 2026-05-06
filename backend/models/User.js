class User {
    constructor(id, username, isAdmin) {
      this.id = id;
      this.username = username;
      this.isAdmin = isAdmin === 1; // Convert to boolean
    }
  
    // Convert raw database object to User model
    static fromDb(dbUser) {
      return new User(
        dbUser.id,
        dbUser.username,
        dbUser.isAdmin
      );
    }
  }
  
  module.exports = User;