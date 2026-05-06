// backend/middleware/errorHandler.js

// Catch-all middleware for handling errors
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Check if headers have already been sent
    if (res.headersSent) {
      return next(err);
    }
    
    // Set status code based on error or default to 500
    const statusCode = err.statusCode || 500;
    
    // Return error response
    res.status(statusCode).json({
      success: false,
      message: err.message || 'An unexpected error occurred',
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  };
  
  // Custom error class for API errors
  class ApiError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.name = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  // Middleware to catch async errors
  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  
  module.exports = {
    errorHandler,
    ApiError,
    asyncHandler
  };