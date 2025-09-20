import { Router } from 'express';

const router = Router();

router.post('/run', (req, res) => {
  // TODO: Implement payout run
  // 1. Validate request
  // 2. Determine who to pay out
  // 3. Create payout records
  console.log('Running payout:', req.body);
  res.json({ message: 'Payout run initiated' });
});

export default router;
