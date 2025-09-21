import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../lib/validation';
import { idempotency } from '../lib/idempotency';
import { authenticate } from '../lib/auth';

const router = Router();

const quoteSchema = z.object({
  fiatAmount: z.number(),
  fiatCurrency: z.string(),
  cryptoCurrency: z.string(),
});

const orderSchema = z.object({
  quoteId: z.string(),
});

router.post('/quote', authenticate, idempotency, validate(quoteSchema), (req, res) => {
  // TODO: Implement quote generation
  res.json({ message: 'Quote generated' });
});

router.post('/orders', authenticate, idempotency, validate(orderSchema), (req, res) => {
  // TODO: Implement order creation
  res.status(201).json({ message: 'Order created' });
});

export default router;
