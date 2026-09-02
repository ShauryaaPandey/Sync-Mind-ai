import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import { createAndProcessMeeting, getUserMeetings, getMeetingById } from '../controllers/meetingController';

const router = Router();

router.post('/process', protect, createAndProcessMeeting);
router.get('/', protect, getUserMeetings);
router.get('/:id', protect, getMeetingById);

export default router;