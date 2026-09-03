import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Meeting } from '../models/Meeting';

export const getUserAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const meetings = await Meeting.find({ userId: req.userId });

    const totalMeetings = meetings.length;
    let totalTasks = 0;
    let completedTasks = 0;
    const sentimentCounts = { Positive: 0, Neutral: 0, Negative: 0 };

    meetings.forEach((m) => {
      totalTasks += m.actionItems.length;
      completedTasks += m.actionItems.filter((item) => item.completed).length;
      if (m.sentiment in sentimentCounts) {
        sentimentCounts[m.sentiment as keyof typeof sentimentCounts]++;
      }
    });

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      totalMeetings,
      totalTasks,
      completedTasks,
      taskCompletionRate,
      sentimentCounts
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate analytics', error: (error as Error).message });
  }
};