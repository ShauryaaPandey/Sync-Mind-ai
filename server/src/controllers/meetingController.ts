import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Meeting } from '../models/Meeting';
import { ChatMessage } from '../models/chatMessage';
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

export const createEmptyMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    const userId = req.userId;

    const meeting = await Meeting.create({
      title: title || 'New Live Meeting',
      userId,
      transcript: '',
      summary: '',
      actionItems: [],
      keyDecisions: [],
      sentiment: 'Neutral'
    });

    res.status(201).json({ message: 'Meeting created successfully', meeting });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ message: 'Failed to create meeting', error: (error as Error).message });
  }
};

export const summarizeMeetingFromChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const meeting = await Meeting.findOne({ _id: id, userId });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const chatMessages = await ChatMessage.find({ meetingId: id })
      .sort({ createdAt: 1 })
      .lean();

    if (chatMessages.length === 0) {
      return res.status(400).json({ message: 'No messages to summarize. Please have a conversation first.' });
    }

    const transcript = chatMessages
      .map((msg) => `${msg.senderName}: ${msg.message}`)
      .join('\n');

    const aiResult = await processMeetingTranscript(transcript);

    meeting.title = aiResult.title || meeting.title;
    meeting.transcript = transcript;
    meeting.summary = aiResult.summary || '';
    meeting.actionItems = aiResult.actionItems || [];
    meeting.keyDecisions = aiResult.keyDecisions || [];
    meeting.sentiment = aiResult.sentiment || 'Neutral';

    await meeting.save();

    res.json({ message: 'Meeting summarized successfully', meeting });
  } catch (error) {
    console.error('Error summarizing meeting:', error);
    res.status(500).json({ message: 'Failed to summarize meeting', error: (error as Error).message });
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
    // For meetings accessed via /meetings/:id route, only show if user owns it
    const meeting = await Meeting.findOne({ _id: req.params.id, userId: req.userId });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meeting details', error: (error as Error).message });
  }
};

export const getMeetingByIdShared = async (req: AuthRequest, res: Response) => {
  try {
    // For shared access (anyone can view if they have the ID)
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meeting details', error: (error as Error).message });
  }
};