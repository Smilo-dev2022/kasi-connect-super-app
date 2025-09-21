import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { idempotency } from '../idempotency';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    idempotencyKey: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

describe('Idempotency Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let prisma: PrismaClient;

  beforeEach(() => {
    req = {
      headers: { 'idempotency-key': 'test-key' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
    prisma = new PrismaClient();
  });

  it('should call next() if no idempotency key is provided', async () => {
    req.headers = {};
    await idempotency(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return a cached response if one is found', async () => {
    const cachedResponse = {
      statusCode: 200,
      responseBody: '{"message":"cached"}',
    };
    (prisma.idempotencyKey.findUnique as jest.Mock).mockResolvedValue(cachedResponse);

    await idempotency(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('{"message":"cached"}');
    expect(next).not.toHaveBeenCalled();
  });

  it('should cache the response for a new request', async () => {
    (prisma.idempotencyKey.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.idempotencyKey.create as jest.Mock).mockResolvedValue(undefined); // Return a promise
    res.statusCode = 201;

    await idempotency(req as Request, res as Response, next);

    (res.send as jest.Mock)('{"message":"new"}');

    expect(prisma.idempotencyKey.create).toHaveBeenCalledWith({
      data: {
        id: 'test-key',
        responseBody: '{"message":"new"}',
        statusCode: 201,
      },
    });
  });
});
