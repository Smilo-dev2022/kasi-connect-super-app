import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret';

export const verifyHmac = (req: Request, res: Response, next: NextFunction) => {
  const signature = req.headers['x-partner-signature'] as string;

  if (!signature) {
    return res.status(401).json({ message: 'Signature is missing' });
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = Buffer.from(hmac.update(JSON.stringify(req.body)).digest('hex'), 'utf8');
  const receivedSignature = Buffer.from(signature, 'utf8');

  if (!crypto.timingSafeEqual(digest, receivedSignature)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  next();
};
