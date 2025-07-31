import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/profile', authenticate, authorize('user'), async (req, res) => {
  res.json({ message: 'User profile endpoint' });
});

router.put('/profile', authenticate, authorize('user'), async (req, res) => {
  res.json({ message: 'Update user profile endpoint' });
});

router.get('/dashboard', authenticate, authorize('user'), async (req, res) => {
  res.json({ message: 'User dashboard endpoint' });
});

export default router;