// backend/middleware/auth.js

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
      return next();
    }
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  };
  
  // Middleware to check if user is an admin
  const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.isAdmin === 1) {
      return next();
    }
    return res.status(403).json({ 
      success: false, 
      message: 'Admin privileges required' 
    });
  };
  
  module.exports = {
    isAuthenticated,
    isAdmin
  };