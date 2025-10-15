// backend/src/middleware/auth.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import type mongoose from 'mongoose';

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

export const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Get token from header or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError(401, 'Access token is required');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // Get user from token
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      throw new ApiError(401, 'Token is invalid or user not found');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is deactivated');
    }

    const userId = (user._id as mongoose.Types.ObjectId)
    // Add user to request object
    req.user = {
      userId: userId.toString(),
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, 'Invalid token');
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'Token expired');
    } else {
      throw error;
    }
  }
});

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'Access token is required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, `Access denied. Required roles: ${roles.join(', ')}`);
    }

    next();
  };
};

// Admin only middleware
export const adminOnly = authorize('admin');

// Driver only middleware  
export const driverOnly = authorize('driver');

// Customer only middleware
export const customerOnly = authorize('customer');

// Driver or Admin middleware
export const driverOrAdmin = authorize('driver', 'admin');

// Any authenticated user
export const authenticatedUser = authenticate;
