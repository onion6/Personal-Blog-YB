import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET;

if (NODE_ENV === 'production' && !JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required in production.');
  process.exit(1);
}

const secret = JWT_SECRET || 'dev-only-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

export function generateToken(payload: { id: number; username: string }): string {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string): { id: number; username: string } {
  return jwt.verify(token, secret) as { id: number; username: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未登录，请先登录' });
    return;
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token 无效或已过期，请重新登录' });
  }
}
