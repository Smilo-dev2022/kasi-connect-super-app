import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { verifyHmac } from '../hmac';

describe('HMAC Verification Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  const secret = 'your-webhook-secret';

  beforeEach(() => {
    req = {
      headers: {},
      body: { message: 'test' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should call next() if signature is valid', () => {
    const hmac = crypto.createHmac('sha256', secret);
    const signature = hmac.update(JSON.stringify(req.body)).digest('hex');
    req.headers = { 'x-partner-signature': signature };

    verifyHmac(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it('should return a 401 error if signature is missing', () => {
    verifyHmac(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Signature is missing' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return a 401 error if signature is invalid', () => {
    const hmac = crypto.createHmac('sha256', 'a-different-secret');
    const signature = hmac.update(JSON.stringify(req.body)).digest('hex');
    req.headers = { 'x-partner-signature': signature };

    verifyHmac(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid signature' });
    expect(next).not.toHaveBeenCalled();
  });
});
