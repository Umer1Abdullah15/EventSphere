// backend/controllers/authController.js
const userDao = require('../dao/userDao');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

// Controller for authentication operations
class AuthController {
  // User login
  login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    
    const result = await userDao.validateUser(username, password);
    
    if (!result.success) {
      throw new ApiError(result.message, 401);
    }
    
    // Set user in session
    req.session.user = result.user;
    
    res.json({ 
      success: true, 
      message: 'Login successful',
      user: {
        username: result.user.username,
        isAdmin: result.user.isAdmin === 1
      }
    });
  });

  // User logout
  logout = asyncHandler(async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        throw new ApiError('Error logging out', 500);
      }
      
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Logout successful' });
    });
  });

  // User signup
  signup = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    
    const result = await userDao.createUser(username, password);
    
    if (!result.success) {
      throw new ApiError(result.message, 400);
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      userId: result.userId
    });
  });

  // Check authentication status
  checkAuth = asyncHandler(async (req, res) => {
    if (req.session && req.session.user) {
      res.json({ 
        success: true, 
        isAuthenticated: true,
        user: {
          username: req.session.user.username,
          isAdmin: req.session.user.isAdmin === 1
        }
      });
    } else {
      res.json({ 
        success: true, 
        isAuthenticated: false 
      });
    }
  });
}

module.exports = new AuthController();