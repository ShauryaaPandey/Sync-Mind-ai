import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a specific meeting room
    socket.on('join-meeting', (meetingId: string) => {
      socket.join(meetingId);
      console.log(`Socket ${socket.id} joined meeting room: ${meetingId}`);
    });

    // Leave a specific meeting room
    socket.on('leave-meeting', (meetingId: string) => {
      socket.leave(meetingId);
      console.log(`Socket ${socket.id} left meeting room: ${meetingId}`);
    });

    // Handle live audio/transcript stream chunk
    socket.on('stream-transcript-chunk', ({ meetingId, chunk }) => {
      socket.to(meetingId).emit('receive-transcript-chunk', chunk);
    });

    // Handle real-time task update
    socket.on('update-task-status', ({ meetingId, actionItemId, completed }) => {
      io.to(meetingId).emit('task-status-changed', { actionItemId, completed });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};