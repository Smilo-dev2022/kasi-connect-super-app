import { Router } from 'express';

const router = Router();

router.post('/debit', (req, res) => {
  // TODO: Implement payout debit
  // 1. Validate request
  // 2. Create debit transaction
  // 3. Return transaction details
  console.log('Debiting wallet for payout:', req.body);
  res.json({ message: 'Wallet debited for payout' });
});

export default router;
