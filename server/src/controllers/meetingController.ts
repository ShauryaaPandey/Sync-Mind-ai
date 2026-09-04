import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Meeting } from '../models/Meeting';
import { ChatMessage } from '../models/chatMessage';
import { processMeetingTranscript } from '../services/aiService';
import { embedAndStoreMeetingTranscript, generateEmbedding, findSimilarChunks } from '../services/embeddingService';
import { GoogleGenAI } from '@google/genai';

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

    embedAndStoreMeetingTranscript(meeting._id.toString(), userId!, transcript).catch((error) => {
      console.error('Failed to embed meeting transcript:', error);
    });
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

    embedAndStoreMeetingTranscript(meeting._id.toString(), userId!, transcript).catch((error) => {
      console.error('Failed to embed meeting transcript:', error);
    });
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

export const searchMeetingsSemanticly = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.body;
    const userId = req.userId;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const queryEmbedding = await generateEmbedding(query);

    const similarChunks = await findSimilarChunks(
      queryEmbedding,
      { userId: userId! },
      20
    );

    if (similarChunks.length === 0) {
      return res.json([]);
    }

    const meetingScores = new Map<string, { bestScore: number; bestSnippet: string }>();

    for (const chunk of similarChunks) {
      const existing = meetingScores.get(chunk.meetingId);
      
      if (!existing || chunk.score > existing.bestScore) {
        meetingScores.set(chunk.meetingId, {
          bestScore: chunk.score,
          bestSnippet: chunk.text
        });
      }
    }

    const meetingIds = Array.from(meetingScores.keys());
    const meetings = await Meeting.find({ _id: { $in: meetingIds } })
      .select('_id title createdAt')
      .lean();

    const results = meetings.map((meeting: any) => {
      const scoreData = meetingScores.get(meeting._id.toString());
      return {
        meetingId: meeting._id.toString(),
        title: meeting.title,
        bestSnippet: scoreData?.bestSnippet || '',
        score: scoreData?.bestScore || 0,
        createdAt: meeting.createdAt
      };
    });

    results.sort((a, b) => b.score - a.score);

    res.json(results);
  } catch (error) {
    console.error('Error in semantic search:', error);
    res.status(500).json({ message: 'Failed to search meetings', error: (error as Error).message });
  }
};

export const chatWithMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { question } = req.body;
    const userId = req.userId;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const meeting = await Meeting.findOne({ _id: id, userId });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const questionEmbedding = await generateEmbedding(question);

    const meetingIdString = Array.isArray(id) ? id[0] : id;
    const relevantChunks = await findSimilarChunks(
      questionEmbedding,
      { meetingId: meetingIdString },
      5
    );

    if (relevantChunks.length === 0) {
      return res.json({
        answer: 'I could not find relevant information in this meeting to answer your question.',
        sourceChunks: []
      });
    }

    const context = relevantChunks
      .map((chunk, idx) => `[${idx + 1}] ${chunk.text}`)
      .join('\n\n');

    const prompt = `You are an AI assistant helping users understand their meeting transcripts. Answer the question based ONLY on the provided context from the meeting. If the context doesn't contain enough information to answer the question, say so clearly.

Context from the meeting:
${context}

Question: ${question}

Answer:`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is missing or invalid');
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt
    });

    const answer = response.text || 'I could not generate an answer at this time.';

    res.json({
      answer,
      sourceChunks: relevantChunks.map(chunk => ({
        text: chunk.text,
        score: chunk.score
      }))
    });
  } catch (error) {
    console.error('Error in meeting chat:', error);
    res.status(500).json({ message: 'Failed to chat with meeting', error: (error as Error).message });
  }
};