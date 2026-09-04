import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import { getMeetingRoom } from '../controllers/chatController';

const router = Router();

router.get(
  '/meetings/:meetingId/room',
  protect,
  getMeetingRoom
);

export default router;