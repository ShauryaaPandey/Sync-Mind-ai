import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Meeting } from '../models/Meeting';
import { processMeetingTranscript } from '../services/aiService';

export const createAndProcessMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const { transcript } = req.body;
    const userId = req.userId;

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ message: 'Valid transcript text is required' });
    }

    const aiResult = await processMeetingTranscript(transcript);

    const meeting = await Meeting.create({
      title: aiResult.title || 'Untitled Meeting',
      userId,
      transcript,
      summary: aiResult.summary || '',
      actionItems: aiResult.actionItems || [],
      keyDecisions: aiResult.keyDecisions || [],
      sentiment: aiResult.sentiment || 'Neutral'
    });

    res.status(201).json({ message: 'Meeting processed successfully', meeting });
  } catch (error) {
    console.error('Error processing meeting:', error);
    res.status(500).json({ message: 'Failed to process meeting with AI', error: (error as Error).message });
  }
};

export const getUserMeetings = async (req: AuthRequest, res: Response) => {
  try {
    const meetings = await Meeting.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch meetings', error: (error as Error).message });
  }
};

export const getMeetingById = async (req: AuthRequest, res: Response) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, userId: req.userId });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meeting details', error: (error as Error).message });
  }
};