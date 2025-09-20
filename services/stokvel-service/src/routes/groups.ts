import { Router } from 'express';

const router = Router();

router.post('/create', (req, res) => {
  // TODO: Implement group creation
  console.log('Creating group:', req.body);
  res.status(201).json({ message: 'Group created' });
});

router.post('/join', (req, res) => {
  // TODO: Implement joining a group
  console.log('Joining group:', req.body);
  res.json({ message: 'Joined group' });
});

export default router;
