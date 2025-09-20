import { Router } from 'express';

const router = Router();

router.post('/', (req, res) => {
  // TODO: Implement payout creation
  // 1. Validate request
  // 2. Interact with payment partner
  // 3. Create payout record in DB
  console.log('Creating payout:', req.body);
  res.status(202).json({ message: 'Payout initiated' });
});

export default router;
