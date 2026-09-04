import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';

import { ChatMessage } from './models/chatMessage';
import { Meeting } from './models/Meeting';
import { User } from './models/User';

interface SocketAuthPayload {
  id: string;
}

interface ChatMessagePayload {
  meetingId: string;
  message: string;
}

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret'
      ) as SocketAuthPayload;

      const user = await User.findById(decoded.id).select('_id name');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.userId = user._id.toString();
      socket.data.userName = user.name;

      next();
    } catch (error) {
      console.error('Socket authentication failed:', error);
      next(new Error('Invalid socket authentication'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id} (${socket.data.userName})`);

    socket.on(
      'join-meeting',
      async (
        meetingId: string,
        callback?: (response: { ok: boolean; error?: string }) => void
      ) => {
        try {
          const meeting = await Meeting.findById(meetingId).select('_id');

          if (!meeting) {
            callback?.({
              ok: false,
              error: 'Meeting not found'
            });
            return;
          }

          socket.join(meetingId);
          socket.data.meetingId = meetingId;

          const roomSize = io.sockets.adapter.rooms.get(meetingId)?.size ?? 0;

          io.to(meetingId).emit('meeting-presence', {
            count: roomSize
          });

          callback?.({ ok: true });

          console.log(`Socket ${socket.id} joined meeting ${meetingId}`);
        } catch (error) {
          console.error('Failed to join meeting:', error);
          callback?.({
            ok: false,
            error: 'Failed to join meeting'
          });
        }
      }
    );

    socket.on('leave-meeting', (meetingId: string) => {
      socket.leave(meetingId);

      if (socket.data.meetingId === meetingId) {
        socket.data.meetingId = undefined;
      }

      const roomSize = io.sockets.adapter.rooms.get(meetingId)?.size ?? 0;

      io.to(meetingId).emit('meeting-presence', {
        count: roomSize
      });
    });

    socket.on(
      'send-chat-message',
      async (
        { meetingId, message }: ChatMessagePayload,
        callback?: (response: { ok: boolean; error?: string }) => void
      ) => {
        try {
          const cleanMessage =
            typeof message === 'string' ? message.trim() : '';

          if (!cleanMessage) {
            callback?.({
              ok: false,
              error: 'Message cannot be empty'
            });
            return;
          }

          if (cleanMessage.length > 2000) {
            callback?.({
              ok: false,
              error: 'Message is too long'
            });
            return;
          }

          if (!socket.rooms.has(meetingId)) {
            callback?.({
              ok: false,
              error: 'Join the meeting room first'
            });
            return;
          }

          const meeting = await Meeting.findById(meetingId).select('_id');

          if (!meeting) {
            callback?.({
              ok: false,
              error: 'Meeting not found'
            });
            return;
          }

          const savedMessage = await ChatMessage.create({
            meetingId,
            userId: socket.data.userId,
            senderName: socket.data.userName,
            message: cleanMessage
          });

          const payload = {
            _id: savedMessage._id.toString(),
            meetingId,
            userId: socket.data.userId,
            senderName: socket.data.userName,
            message: savedMessage.message,
            createdAt: savedMessage.createdAt
          };

          io.to(meetingId).emit('chat-message', payload);

          callback?.({ ok: true });
        } catch (error) {
          console.error('Failed to send chat message:', error);
          callback?.({
            ok: false,
            error: 'Failed to send message'
          });
        }
      }
    );

    socket.on('typing-start', (meetingId: string) => {
      if (!socket.rooms.has(meetingId)) {
        return;
      }

      socket.to(meetingId).emit('user-typing', {
        userId: socket.data.userId,
        senderName: socket.data.userName
      });
    });

    socket.on('typing-stop', (meetingId: string) => {
      if (!socket.rooms.has(meetingId)) {
        return;
      }

      socket.to(meetingId).emit('user-stopped-typing', {
        userId: socket.data.userId
      });
    });

    socket.on('stream-transcript-chunk', ({ meetingId, chunk }) => {
      if (!socket.rooms.has(meetingId)) {
        return;
      }

      socket.to(meetingId).emit('receive-transcript-chunk', chunk);
    });

    socket.on(
      'update-task-status',
      ({ meetingId, actionItemId, completed }) => {
        if (!socket.rooms.has(meetingId)) {
          return;
        }

        io.to(meetingId).emit('task-status-changed', {
          actionItemId,
          completed
        });
      }
    );

    socket.on('disconnect', () => {
      const meetingId = socket.data.meetingId as string | undefined;

      if (meetingId) {
        const roomSize = io.sockets.adapter.rooms.get(meetingId)?.size ?? 0;

        io.to(meetingId).emit('meeting-presence', {
          count: roomSize
        });
      }

      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};