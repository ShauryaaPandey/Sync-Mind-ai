import { useState, useEffect } from 'react';
import { CheckSquare, Square, User } from 'lucide-react';
import API from '../services/api';
import { socketService } from '../services/socket';

interface ActionItem {
  _id: string;
  title: string;
  assignedTo: string;
  completed: boolean;
}

interface Props {
  meetingId: string;
  initialTasks: ActionItem[];
}

export const TaskChecklist = ({ meetingId, initialTasks }: Props) => {
  const [tasks, setTasks] = useState<ActionItem[]>(initialTasks);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    socketService.onTaskStatusChange(({ actionItemId, completed }) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task._id === actionItemId ? { ...task, completed } : task))
      );
    });
  }, []);

  const handleToggle = async (taskId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    // Optimistic UI update
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, completed: newStatus } : t)));

    try {
      await API.patch(`/tasks/${meetingId}/items/${taskId}`, { completed: newStatus });
      socketService.emitTaskUpdate(meetingId, taskId, newStatus);
    } catch (err) {
      console.error('Failed to sync task status', err);
      // Revert status on failure
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, completed: currentStatus } : t)));
    }
  };

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task._id}
          onClick={() => handleToggle(task._id, task.completed)}
          className="flex items-center justify-between p-3.5 bg-gray-800 border border-gray-700/80 rounded-lg cursor-pointer hover:border-gray-600 transition"
        >
          <div className="flex items-center gap-3">
            {task.completed ? (
              <CheckSquare className="w-5 h-5 text-indigo-400" />
            ) : (
              <Square className="w-5 h-5 text-gray-500" />
            )}
            <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
              {task.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
            <User className="w-3.5 h-3.5" />
            <span>{task.assignedTo || 'Unassigned'}</span>
          </div>
        </div>
      ))}
      {tasks.length === 0 && <p className="text-gray-500 text-sm italic">No action items extracted for this meeting.</p>}
    </div>
  );
};