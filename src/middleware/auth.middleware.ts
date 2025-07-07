import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.config';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../errors/error.handler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

/**
 * JWT Authentication middleware
 */
export const authenticate = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Access token is required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify token
      const decoded = jwt.verify(token, config.JWT_SECRET) as any;
      
      // Add user to request object
      req.user = {
        id: decoded.id || decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw AppError.unauthorized('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw AppError.unauthorized('Invalid token');
      } else {
        throw AppError.unauthorized('Token verification failed');
      }
    }
  }
);

/**
 * Optional authentication middleware
 */
export const optionalAuth = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as any;
        
        req.user = {
          id: decoded.id || decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }

    next();
  }
);

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles: string[]) => {
  return asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required');
      }

      if (roles.length > 0 && !roles.includes(req.user.role || '')) {
        throw AppError.forbidden('Insufficient permissions');
      }

      next();
    }
  );
};

/**
 * Generate JWT token
 */
export const generateToken = (payload: object, expiresIn?: string): string => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: expiresIn || config.JWT_EXPIRES_IN,
  });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    throw AppError.unauthorized('Invalid token');
  }
};