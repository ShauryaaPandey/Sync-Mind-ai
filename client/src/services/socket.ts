import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export interface ChatMessage {
  _id: string;
  meetingId: string;
  userId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

interface MeetingPresence {
  count: number;
}

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket) {
      return this.socket;
    }

    const token = localStorage.getItem('syncmind_token');

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true
    });

    this.socket.connect();

    return this.socket;
  }

  joinMeeting(
    meetingId: string,
    callback?: (ok: boolean, error?: string) => void
  ) {
    if (!this.socket) {
      callback?.(false, 'Socket is not connected');
      return;
    }

    this.socket.emit(
      'join-meeting',
      meetingId,
      (response: { ok: boolean; error?: string }) => {
        callback?.(response.ok, response.error);
      }
    );
  }

  leaveMeeting(meetingId: string) {
    this.socket?.emit('leave-meeting', meetingId);
  }

  sendChatMessage(meetingId: string, message: string) {
    return new Promise<void>((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Socket is not connected'));
        return;
      }

      this.socket.emit(
        'send-chat-message',
        { meetingId, message },
        (response: { ok: boolean; error?: string }) => {
          if (response.ok) {
            resolve();
          } else {
            reject(
              new Error(response.error || 'Failed to send message')
            );
          }
        }
      );
    });
  }

  startTyping(meetingId: string) {
    this.socket?.emit('typing-start', meetingId);
  }

  stopTyping(meetingId: string) {
    this.socket?.emit('typing-stop', meetingId);
  }

  onChatMessage(callback: (message: ChatMessage) => void) {
    if (!this.socket) {
      return () => {};
    }

    this.socket.on('chat-message', callback);

    return () => {
      this.socket?.off('chat-message', callback);
    };
  }

  onMeetingPresence(callback: (data: MeetingPresence) => void) {
    if (!this.socket) {
      return () => {};
    }

    this.socket.on('meeting-presence', callback);

    return () => {
      this.socket?.off('meeting-presence', callback);
    };
  }

  onTypingStart(
    callback: (data: { userId: string; senderName: string }) => void
  ) {
    if (!this.socket) {
      return () => {};
    }

    this.socket.on('user-typing', callback);

    return () => {
      this.socket?.off('user-typing', callback);
    };
  }

  onTypingStop(callback: (data: { userId: string }) => void) {
    if (!this.socket) {
      return () => {};
    }

    this.socket.on('user-stopped-typing', callback);

    return () => {
      this.socket?.off('user-stopped-typing', callback);
    };
  }

  emitTaskUpdate(
    meetingId: string,
    actionItemId: string,
    completed: boolean
  ) {
    this.socket?.emit('update-task-status', {
      meetingId,
      actionItemId,
      completed
    });
  }

  onTaskStatusChange(
    callback: (data: {
      actionItemId: string;
      completed: boolean;
    }) => void
  ) {
    if (!this.socket) {
      return () => {};
    }

    this.socket.on('task-status-changed', callback);

    return () => {
      this.socket?.off('task-status-changed', callback);
    };
  }

  onConnectionError(callback: (error: Error) => void) {
    if (!this.socket) {
      return () => {};
    }

    this.socket.on('connect_error', callback);

    return () => {
      this.socket?.off('connect_error', callback);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();