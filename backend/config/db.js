// backend/config/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.resolve(__dirname, '../data/eventease.db');

// Create a database connection
const openDb = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error connecting to the database:', err.message);
        reject(err);
      } else {
        console.log('Connected to the database');
        resolve(db);
      }
    });
  });
};

// Run a SQL query with parameters
const run = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error('Error running SQL:', sql);
        console.error(err);
        reject(err);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
};

// Get all rows from a SQL query
const all = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Error querying SQL:', sql);
        console.error(err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Get a single row from a SQL query
const get = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('Error querying SQL:', sql);
        console.error(err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Close the database connection
const closeDb = (db) => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        reject(err);
      } else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
};

module.exports = {
  openDb,
  run,
  all,
  get,
  closeDb
};