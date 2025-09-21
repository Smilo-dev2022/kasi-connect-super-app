import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const idempotency = async (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers['idempotency-key'] as string;

  if (!idempotencyKey) {
    return next();
  }

  const cachedResponse = await prisma.idempotencyKey.findUnique({
    where: { id: idempotencyKey },
  });

  if (cachedResponse) {
    return res.status(cachedResponse.statusCode).send(cachedResponse.responseBody);
  }

  const originalSend = res.send;
  res.send = function (body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      prisma.idempotencyKey.create({
        data: {
          id: idempotencyKey,
          responseBody: body,
          statusCode: res.statusCode,
        },
      }).catch(console.error);
    }
    return originalSend.apply(res, arguments as any);
  };

  next();
};
