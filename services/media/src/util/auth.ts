import { Request, Response, NextFunction } from 'express';

const API_KEY_HEADER = 'x-api-key';

export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.MEDIA_API_KEY || 'dev-media-key';
  const provided = req.header(API_KEY_HEADER);
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  return next();
}

