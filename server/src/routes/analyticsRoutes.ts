import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import { getUserAnalytics } from '../controllers/analyticsController';

const router = Router();
router.get('/', protect, getUserAnalytics);

export default router;