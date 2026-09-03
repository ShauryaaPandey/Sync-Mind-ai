import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true
      });
    }
    return this.socket;
  }

  joinMeeting(meetingId: string) {
    this.socket?.emit('join-meeting', meetingId);
  }

  leaveMeeting(meetingId: string) {
    this.socket?.emit('leave-meeting', meetingId);
  }

  emitTaskUpdate(meetingId: string, actionItemId: string, completed: boolean) {
    this.socket?.emit('update-task-status', { meetingId, actionItemId, completed });
  }

  onTaskStatusChange(callback: (data: { actionItemId: string; completed: boolean }) => void) {
    this.socket?.on('task-status-changed', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();