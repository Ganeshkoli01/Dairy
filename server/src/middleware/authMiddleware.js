import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      let dbUser = null;
      if (mongoose.connection.readyState === 1) {
        dbUser = await User.findById(decoded.id)
          .select('-password')
          .populate('branch', 'name code')
          .catch(() => null);
      }

      req.user = dbUser || {
        _id: decoded.id || 'mock_id',
        id: decoded.id || 'mock_id',
        email: decoded.email,
        role: decoded.role,
        branch: decoded.branch || null,
        name: decoded.name || (decoded.role === 'owner' || decoded.role === 'admin' ? 'Dairy Owner' : 'Dairy User'),
      };

      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid or expired token',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }
};

// Alias for protect
export const protect = authenticateToken;

export const authorizeRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    // Map synonyms: 'owner' <-> 'admin', 'user' <-> 'operator'
    const isAuthorized = allowedRoles.some((role) => {
      if (role === userRole) return true;
      if ((role === 'admin' || role === 'owner') && (userRole === 'admin' || userRole === 'owner')) return true;
      if ((role === 'operator' || role === 'user') && (userRole === 'operator' || userRole === 'user')) return true;
      return false;
    });

    if (!req.user || !isAuthorized) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${userRole || 'unknown'}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

// Variadic alias for authorizeRole
export const authorize = (...roles) => authorizeRole(roles);
