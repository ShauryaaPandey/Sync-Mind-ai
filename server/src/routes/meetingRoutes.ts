import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import { createAndProcessMeeting, createEmptyMeeting, summarizeMeetingFromChat, getUserMeetings, getMeetingById, getMeetingByIdShared } from '../controllers/meetingController';

const router = Router();

router.post('/process', protect, createAndProcessMeeting);
router.post('/create', protect, createEmptyMeeting);
router.post('/:id/summarize', protect, summarizeMeetingFromChat);
router.get('/', protect, getUserMeetings);
router.get('/:id', protect, getMeetingById);
router.get('/:id/shared', protect, getMeetingByIdShared);

export default router;