import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Meeting } from '../models/Meeting';
import { ChatMessage } from '../models/chatMessage';

export const getMeetingRoom = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { meetingId } = req.params;

    // Allow any authenticated user to access the meeting room (for collaboration)
    const meeting = await Meeting.findById(meetingId)
      .select('_id title createdAt userId');

    if (!meeting) {
      return res.status(404).json({
        message: 'Meeting not found'
      });
    }

    const messages = await ChatMessage.find({
      meetingId
    })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    return res.json({
      meeting,
      messages
    });
  } catch (error) {
    console.error('Error fetching meeting room:', error);

    return res.status(500).json({
      message: 'Failed to fetch meeting room'
    });
  }
};