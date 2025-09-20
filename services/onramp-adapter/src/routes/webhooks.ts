import { Router } from 'express';

const router = Router();

router.post('/partner', (req, res) => {
  // TODO: Implement webhook ingestion
  // 1. Verify webhook signature
  // 2. Normalize webhook data
  // 3. Post to wallet service
  console.log('Received webhook:', req.body);
  res.sendStatus(200);
});

export default router;
