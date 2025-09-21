import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../auth';

jest.mock('jsonwebtoken');

describe('Authentication Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: { authorization: 'Bearer valid-token' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should call next() if authentication is successful', () => {
    (jwt.verify as jest.Mock).mockReturnValue({ userId: '123' });
    authenticate(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toEqual({ userId: '123' });
  });

  it('should return a 401 error if authorization header is missing', () => {
    req.headers = {};
    authenticate(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authorization header is missing' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return a 401 error if token is missing', () => {
    req.headers = { authorization: 'Bearer ' };
    authenticate(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token is missing' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return a 401 error if token is invalid', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });
    authenticate(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });
});
