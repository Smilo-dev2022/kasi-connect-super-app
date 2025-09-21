import { Router } from 'express';
import { verifyHmac } from '../lib/hmac';

const router = Router();

router.post('/partner', verifyHmac, (req, res) => {
  // TODO: Implement webhook ingestion
  console.log('Received verified webhook:', req.body);
  res.sendStatus(200);
});

export default router;
