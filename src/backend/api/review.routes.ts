import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  res.json({ message: 'Create review endpoint' });
});

router.get('/attorney/:attorneyId', async (req, res) => {
  res.json({ message: 'Get attorney reviews endpoint' });
});

export default router;