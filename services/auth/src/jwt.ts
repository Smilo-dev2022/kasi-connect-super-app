import jwt, { type JwtPayload, type Secret, type SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from './config';

export type JwtUser = { sub: string; name?: string };

export function signToken(payload: JwtUser): string {
  return jwt.sign(payload as JwtPayload, config.jwtSecret as Secret, { expiresIn: config.jwtExpiresIn } as SignOptions);
}

export function signRefreshToken(payload: JwtUser): string {
  return jwt.sign(payload as JwtPayload, config.refreshJwtSecret as Secret, { expiresIn: config.refreshExpiresIn } as SignOptions);
}

export function verifyToken(token: string): JwtUser | null {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtUser;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtUser | null {
  try {
    return jwt.verify(token, config.refreshJwtSecret) as JwtUser;
  } catch {
    return null;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

export function requireJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header('authorization') || req.header('Authorization');
  const token = (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined) || (req.query.token as string | undefined);
  if (!token) return res.status(401).json({ error: 'missing token' });
  const payload = verifyToken(token);
  if (!payload || !payload.sub) return res.status(401).json({ error: 'invalid token' });
  req.user = payload;
  return next();
}

