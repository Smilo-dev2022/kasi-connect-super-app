import { Router } from 'express';

const router = Router();

router.post('/', (req, res) => {
  // TODO: Implement order creation (intent)
  console.log('Creating order intent:', req.body);
  res.status(201).json({ message: 'Order intent created' });
});

router.get('/:id', (req, res) => {
  // TODO: Implement order tracking
  res.json({ id: req.params.id, status: 'PENDING' });
});

export default router;
