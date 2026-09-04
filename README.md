# SyncMind AI

A real-time collaborative meeting management platform powered by AI. Transform your meetings into actionable insights with live chat rooms, instant messaging, and intelligent summarization using Google Gemini AI.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)

## Features

**Real-Time Collaboration**
- Live meeting rooms with instant message synchronization
- Multi-user support with participant tracking
- Typing indicators and presence awareness
- One-click meeting link sharing

**AI-Powered Analysis**
- Automatic meeting summarization using Google Gemini AI
- Action item extraction with assignee tracking
- Key decision identification
- Sentiment analysis (Positive, Neutral, Negative)
- Support for both live chat and transcript processing

**Task Management**
- Interactive checklists with real-time status updates
- Cross-participant task synchronization
- Progress tracking and completion status

## Tech Stack

**Frontend:** React 18, TypeScript, Socket.IO Client, TailwindCSS, React Router, Axios, Vite  
**Backend:** Node.js, Express, TypeScript, Socket.IO, MongoDB, Mongoose  
**AI/ML:** Google Gemini AI  
**Authentication:** JWT, bcryptjs  
**Other:** Multer (file uploads), CORS

## Installation

### Prerequisites
- Node.js v16 or higher
- MongoDB (local or MongoDB Atlas)
- Google Gemini API key ([Get API Key](https://makersuite.google.com/app/apikey))

### Backend Setup

```bash
cd server
npm install
```

Create `.env` file in `server/` directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/syncmind_ai
JWT_SECRET=your_secure_random_string
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

Access the application at `http://localhost:5173`

## Usage

### Live Meeting Rooms

1. Click "New Meeting" on the dashboard
2. Select "Live Meeting Room" tab
3. Enter a meeting title and click "Create Live Meeting Room"
4. Share the meeting link with participants using the "Share Link" button
5. Collaborate in real-time with instant messaging
6. Click "Summarize" to generate AI insights from the conversation

### Process Existing Transcripts

1. Click "New Meeting" on the dashboard
2. Select "Process Transcript" tab
3. Paste your meeting notes or transcript
4. Click "Generate Notes & Tasks" for instant AI analysis

### Managing Meetings

- View all meetings from the dashboard
- Click any meeting to see details: Summary, Action Items, Key Decisions, Full Transcript
- Mark tasks as complete by clicking them (syncs across all participants)
- Access past meeting rooms via the "Live Room" button

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Meetings
- `GET /api/meetings` - Get user's meetings
- `GET /api/meetings/:id` - Get meeting details (owner only)
- `GET /api/meetings/:id/shared` - Get meeting details (any authenticated user)
- `POST /api/meetings/create` - Create empty meeting for live chat
- `POST /api/meetings/process` - Process transcript with AI
- `POST /api/meetings/:id/summarize` - Summarize live chat messages

### Chat
- `GET /api/chat/meetings/:id/room` - Get meeting room and message history

### Tasks
- `PATCH /api/tasks/:meetingId/items/:taskId` - Toggle task completion

### Analytics
- `GET /api/analytics` - Get user analytics and statistics

## Socket.IO Events

**Client to Server:**
- `join-meeting` - Join a meeting room
- `leave-meeting` - Leave a meeting room
- `send-chat-message` - Send a message
- `typing-start` - User started typing
- `typing-stop` - User stopped typing
- `update-task-status` - Update task completion

**Server to Client:**
- `chat-message` - New message received
- `meeting-presence` - Participant count updated
- `user-typing` - Another user is typing
- `user-stopped-typing` - User stopped typing
- `task-status-changed` - Task status updated

## Project Structure

```
Sync-Mind-ai/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   ├── services/       # API and Socket services
│   │   └── assets/         # Static assets
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── middlewares/    # Auth and upload middlewares
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── services/       # AI processing service
│   │   ├── socket.ts       # Socket.IO server
│   │   └── server.ts       # Application entry point
│   └── package.json
└── README.md
```

## Development

### Available Scripts

**Backend:**
```bash
npm run dev      # Development server with hot reload
npm run build    # Compile TypeScript to JavaScript
npm start        # Run production build
```

**Frontend:**
```bash
npm run dev      # Development server with HMR
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Security Features

- Password hashing using bcryptjs
- JWT-based authentication with 7-day token expiration
- Protected API routes with authentication middleware
- Socket.IO connection authentication
- CORS configuration for authorized origins
- Environment variable management for sensitive data
- Input validation and sanitization
- Message length limits (2000 characters)
- Room-based message isolation

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/syncmind_ai` |
| `JWT_SECRET` | Secret key for JWT | `your_secure_random_string` |
| `GEMINI_API_KEY` | Google Gemini API key | `your_api_key` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |

## Troubleshooting

**Backend won't start:**
- Ensure `.env` file exists with all required variables
- Verify MongoDB is running
- Check port 5000 is not in use

**Socket.IO not connecting:**
- Check browser console for errors
- Verify backend is running on correct port
- Ensure CORS is properly configured

**"Meeting not found" error:**
- Confirm you are logged in
- Verify meeting ID in URL is correct
- Check database connection

**AI Summarization fails:**
- Verify `GEMINI_API_KEY` is valid
- Ensure meeting has at least one message
- Check backend logs for detailed errors

## Performance Considerations

- Message history limited to 200 messages per load
- Socket.IO uses WebSocket transport for optimal performance
- MongoDB indexes on frequently queried fields
- Debounced typing indicators to reduce network traffic
- React optimization with memo and useCallback

## Browser Compatibility

- Chrome/Edge v90+
- Firefox v88+
- Safari v14+
- WebSocket support required

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- Google Gemini AI for intelligent text analysis
- Socket.IO for real-time communication infrastructure
- MongoDB for reliable data persistence
- React and Node.js communities for excellent documentation
- Open-source contributors whose libraries made this possible

## Support

For issues, questions, or suggestions, please open an issue on the repository.

---

**Built for better team collaboration through AI-powered meeting intelligence.**
