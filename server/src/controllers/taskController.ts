import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Meeting } from '../models/Meeting';

export const toggleTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { meetingId, actionItemId } = req.params;
    const { completed } = req.body;

    const meeting = await Meeting.findOne({ _id: meetingId, userId: req.userId });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const task = (meeting.actionItems as any).id(actionItemId);
    if (!task) return res.status(404).json({ message: 'Task item not found' });

    task.completed = completed;
    await meeting.save();

    res.json({ message: 'Task status updated successfully', actionItems: meeting.actionItems });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task status', error: (error as Error).message });
  }
};