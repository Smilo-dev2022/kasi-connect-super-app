import { Router } from 'express';

const router = Router();

router.post('/webhooks/partner', (req, res) => {
  // TODO: Implement partner webhook ingestion
  // 1. Verify that the request is coming from the onramp-adapter
  // 2. Update the order status based on the webhook data
  console.log('Received partner webhook:', req.body);
  res.sendStatus(200);
});

export default router;
