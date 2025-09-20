import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  // TODO: Implement vendor listing
  res.json([]);
});

router.get('/:id', (req, res) => {
  // TODO: Implement vendor details
  res.json({ id: req.params.id });
});

router.get('/:id/catalog', (req, res) => {
  // TODO: Implement vendor catalog
  res.json([]);
});

export default router;
