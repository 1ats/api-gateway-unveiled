import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip auth for public routes
    const publicRoutes = ['/health', '/api/auth/login', '/api/auth/register'];
    if (publicRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Optional: Validate token with auth service
      const authResponse = await axios.get(`${AUTH_SERVICE_URL}/api/validate`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });

      req.user = {
        id: decoded.id || authResponse.data.user.id,
        email: decoded.email || authResponse.data.user.email,
        role: decoded.role || authResponse.data.user.role,
        permissions: decoded.permissions || authResponse.data.user.permissions || []
      };

      next();
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({ 
        error: 'Invalid token.' 
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication service unavailable.' 
    });
  }
};

export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${requiredRole}` 
      });
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: `Access denied. Required permission: ${permission}` 
      });
    }

    next();
  };
};