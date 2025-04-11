const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log(`[Auth Middleware] Request path: ${req.path}, Method: ${req.method}`);
    console.log(`[Auth Middleware] Authorization header: ${token ? 'Present' : 'Missing'}`);
    
    if (!token) {
      console.error('[Auth Middleware] No token provided');
      return res.status(401).json({ error: 'Authentication required. Please login.' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`[Auth Middleware] Token verified successfully for user: ${decoded.userId}`);
      
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        console.error(`[Auth Middleware] User not found: ${decoded.userId}`);
        return res.status(401).json({ error: 'User not found. Please login again.' });
      }
      
      req.user = user;
      req.token = token;
      next();
    } catch (jwtError) {
      console.error('[Auth Middleware] JWT verification error:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Your session has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid authentication token. Please login again.',
          code: 'INVALID_TOKEN'
        });
      }
      
      return res.status(401).json({ 
        error: 'Authentication failed. Please login again.',
        code: 'AUTH_FAILED'
      });
    }
  } catch (error) {
    console.error('[Auth Middleware] Unexpected error:', error);
    res.status(500).json({ error: 'Server error during authentication' });
  }
};

module.exports = auth; 