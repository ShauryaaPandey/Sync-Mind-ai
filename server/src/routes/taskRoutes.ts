import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import { toggleTaskStatus } from '../controllers/taskController';

const router = Router();

router.patch('/:meetingId/items/:actionItemId', protect, toggleTaskStatus);

export default router;