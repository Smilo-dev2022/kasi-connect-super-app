import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../validation';

describe('Validation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should call next() if validation is successful', () => {
    const schema = z.object({ name: z.string() });
    req.body = { name: 'test' };
    validate(schema)(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return a 400 error if validation fails', () => {
    const schema = z.object({ name: z.string() });
    req.body = { name: 123 };
    validate(schema)(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
