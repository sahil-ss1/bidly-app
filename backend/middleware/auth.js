import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

// Verify JWT token
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Authorization required.'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
      
      // Get user from database
      const users = await query('SELECT id, name, email, role, bidly_access FROM users WHERE id = ?', [decoded.userId]);
      
      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }
      
      req.user = users[0];
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Check if user has specific role
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

// Check if user has bidly_access (managed by Pali Builds dashboard)
export const requireBidlyAccess = (req, res, next) => {
  if (!req.user.bidly_access) {
    return res.status(403).json({
      success: false,
      error: 'Bidly access required. Please contact admin to grant access through Pali Builds dashboard.'
    });
  }
  
  next();
};

