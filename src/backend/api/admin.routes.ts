import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize(['admin']));

router.get('/dashboard', async (req, res) => {
  res.json({ message: 'Admin dashboard endpoint' });
});

router.get('/attorneys', async (req, res) => {
  res.json({ message: 'Admin attorneys list endpoint' });
});

router.get('/users', async (req, res) => {
  res.json({ message: 'Admin users list endpoint' });
});

export default router;