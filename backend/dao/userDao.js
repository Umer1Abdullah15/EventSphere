// backend/dao/userDao.js
const db = require('../config/db');
const bcrypt = require('bcrypt');

class UserDao {
  // Get a user by username
  async getUserByUsername(username) {
    try {
      const dbConn = await db.openDb();
      
      const user = await db.get(
        dbConn,
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      
      await db.closeDb(dbConn);
      return user;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      throw error;
    }
  }

  // Create a new user (signup)
  async createUser(username, password, isAdmin = 0) {
    try {
      const dbConn = await db.openDb();
      
      // Check if username already exists
      const existingUser = await db.get(
        dbConn,
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      
      if (existingUser) {
        await db.closeDb(dbConn);
        return { success: false, message: 'Username already exists' };
      }
      
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Create the user
      const result = await db.run(
        dbConn,
        'INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)',
        [username, hashedPassword, isAdmin]
      );
      
      await db.closeDb(dbConn);
      return { success: true, userId: result.id };
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  // Validate user credentials
  async validateUser(username, password) {
    try {
      const dbConn = await db.openDb();
      
      const user = await db.get(
        dbConn,
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      
      await db.closeDb(dbConn);
      
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      
      // Compare the provided password with the stored hash
      const isValid = await bcrypt.compare(password, user.password);
      
      if (!isValid) {
        return { success: false, message: 'Invalid password' };
      }
      
      return { 
        success: true, 
        user: { 
          id: user.id, 
          username: user.username, 
          isAdmin: user.isAdmin 
        } 
      };
    } catch (error) {
      console.error('Error in validateUser:', error);
      throw error;
    }
  }
}

module.exports = new UserDao();