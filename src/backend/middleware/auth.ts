import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAuth = authenticate;
export const requireUser = authenticate;
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  authenticate(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

// Alias for authorize function
export const authorize = (roles?: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    authenticate(req, res, () => {
      if (roles && roles.length > 0) {
        if (!req.user?.role || !roles.includes(req.user.role)) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
      }
      next();
    });
  };
};
