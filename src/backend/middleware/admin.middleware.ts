import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Admin access required.',
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error.',
    });
  }
};