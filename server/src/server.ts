import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { connectDB } from './config/db';
import { initSocket } from './socket';
import authRoutes from './routes/authRoutes';
import meetingRoutes from './routes/meetingRoutes';
//import taskRoutes from './routes/taskRoutes';

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

// Initialize WebSockets
export const io = initSocket(httpServer);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
//app.use('/api/tasks', taskRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'SyncMind Server is Running' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});