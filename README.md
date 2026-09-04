# SyncMind AI

An enterprise-grade, real-time collaborative meeting intelligence platform that transforms conversations into actionable insights. Built with modern web technologies and powered by Google Gemini AI, SyncMind AI leverages advanced vector embeddings and RAG (Retrieval-Augmented Generation) to deliver semantic search and context-aware AI assistance.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)

## Key Features

### Real-Time Collaboration
- **Live Meeting Rooms** with WebSocket-powered instant message synchronization
- **Multi-User Support** with real-time participant tracking and presence awareness
- **Typing Indicators** for enhanced collaborative experience
- **One-Click Sharing** with secure meeting links

### AI-Powered Intelligence
- **Automatic Summarization** using Google Gemini AI's advanced language models
- **Smart Action Item Extraction** with assignee identification
- **Key Decision Tracking** to capture critical meeting outcomes
- **Sentiment Analysis** (Positive, Neutral, Negative) for meeting tone assessment
- **Dual Input Support** for both live chat and uploaded transcripts

### Semantic Search & RAG
- **Vector Embeddings** using Google's `gemini-embedding-001` model (768-dimensional)
- **Natural Language Search** across all meetings - find discussions by intent, not just keywords
- **RAG-Powered Chat** - ask contextual questions about any meeting and get AI answers grounded in actual content
- **Cosine Similarity Ranking** with relevance scoring for precision results
- **Real-Time Embedding Generation** integrated into meeting creation workflow

### Task Management
- **Interactive Checklists** with real-time status synchronization
- **Cross-Participant Updates** that sync instantly across all connected users
- **Progress Tracking** with visual completion indicators

## Tech Stack

**Frontend**  
React 18, TypeScript, Socket.IO Client, TailwindCSS, React Router, Axios, Vite

**Backend**  
Node.js, Express 5, TypeScript, Socket.IO, MongoDB, Mongoose

**AI/ML**  
Google Gemini AI (`gemini-1.5-flash` for text generation, `gemini-embedding-001` for vector embeddings)

**Authentication & Security**  
JWT, bcryptjs, CORS, input validation, message length limits

**Vector Search**  
Text embeddings with cosine similarity (ready for MongoDB Atlas Vector Search migration)

**DevOps**  
Multer (file uploads), environment-based configuration

## Quick Start

### Prerequisites
- Node.js v16 or higher
- MongoDB (local instance or MongoDB Atlas)
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Backend Setup

```bash
cd server
npm install
```

Create `.env` file in `server/` directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=YourAppName
JWT_SECRET=your_secure_random_string_here
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
```

> **Note**: For local MongoDB, use `mongodb://127.0.0.1:27017/syncmind_ai`. For MongoDB Atlas, use the connection string from your cluster (replace `username`, `password`, `cluster`, and `YourAppName` with your actual credentials).

Start the server:
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

## Core Workflows

### Live Collaboration
1. Create a new live meeting room from the dashboard
2. Share the secure link with participants
3. Collaborate in real-time with instant message sync
4. Generate AI-powered summaries with one click

### Transcript Processing
1. Upload or paste existing meeting transcripts
2. Receive instant AI analysis with action items and key decisions
3. Vector embeddings automatically generated for future search

### Semantic Search
- Type natural language queries like "budget constraints discussion" or "deployment timeline"
- Get ranked results with relevance scores and contextual snippets
- Results powered by 768-dimensional vector embeddings

### RAG Chat
- Open any meeting and navigate to "Ask AI" tab
- Ask specific questions: "What was the final decision on pricing?"
- Receive accurate, context-grounded answers with source references

## API Reference

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication

### Meetings
- `GET /api/meetings` - List user's meetings
- `GET /api/meetings/:id` - Get meeting details (owner)
- `GET /api/meetings/:id/shared` - Get meeting details (any authenticated user)
- `POST /api/meetings/create` - Create empty meeting for live chat
- `POST /api/meetings/process` - Process transcript with AI
- `POST /api/meetings/:id/summarize` - Summarize live chat messages
- `POST /api/meetings/search` - Semantic search (body: `{ query: string }`)
- `POST /api/meetings/:id/chat` - RAG chat (body: `{ question: string }`)

### Tasks & Analytics
- `PATCH /api/tasks/:meetingId/items/:taskId` - Toggle task completion
- `GET /api/analytics` - User analytics and statistics

### WebSocket Events
**Emit**: `join-meeting`, `leave-meeting`, `send-chat-message`, `typing-start`, `typing-stop`, `update-task-status`  
**Listen**: `chat-message`, `meeting-presence`, `user-typing`, `user-stopped-typing`, `task-status-changed`

## Architecture Highlights

**Vector Embedding Pipeline**  
Intelligent text chunking (650 chars, 100 char overlap) with Google `gemini-embedding-001` producing 768-dimensional embeddings. Cosine similarity computed in-memory with MongoDB storage, architecture-ready for Atlas Vector Search migration.

**Real-Time Infrastructure**  
Socket.IO WebSocket layer with room-based isolation, sub-100ms message sync, live presence tracking, and optimistic UI updates with server reconciliation.

**Security**  
JWT authentication (7-day expiration), bcryptjs password hashing, middleware-protected routes, Socket.IO connection authentication, input validation, and strict CORS configuration.

## Project Structure

```
Sync-Mind-ai/
├── client/                          # React TypeScript frontend
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/                   # Route pages (Dashboard, Analytics, Login, etc.)
│   │   ├── services/                # API client & Socket.IO integration
│   │   └── assets/                  # Static assets
│   └── package.json
├── server/                          # Node.js TypeScript backend
│   ├── src/
│   │   ├── config/                  # Database configuration
│   │   ├── controllers/             # Request handlers
│   │   ├── middlewares/             # Auth & upload middlewares
│   │   ├── models/                  # Mongoose schemas (Meeting, User, ChatMessage, MeetingChunk)
│   │   ├── routes/                  # Express routes
│   │   ├── services/                # AI processing (aiService, embeddingService)
│   │   ├── socket.ts                # Socket.IO real-time server
│   │   └── server.ts                # Application entry point
│   └── package.json
└── README.md
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection | Local: `mongodb://127.0.0.1:27017/syncmind_ai`<br>Atlas: `mongodb+srv://username:password@cluster.mongodb.net/?appName=YourApp` |
| `JWT_SECRET` | JWT signing key | `your_secure_random_string_here` |
| `GEMINI_API_KEY` | Google Gemini key | `your_gemini_api_key_here` |
| `CLIENT_URL` | Frontend URL (CORS) | `http://localhost:5173` |

## Development Commands

**Backend**
```bash
npm run dev      # Development server with hot reload (nodemon + ts-node)
npm run build    # Compile TypeScript to JavaScript
npm start        # Run production build
```

**Frontend**
```bash
npm run dev      # Vite dev server with HMR
npm run build    # Production build with type checking
npm run preview  # Preview production build
npm run lint     # ESLint code quality check
```

## Troubleshooting

**Backend won't start**
- Verify `.env` file exists with all required variables
- Ensure MongoDB is running: `mongod --version` or check Atlas connection
- Check port 5000 availability: `netstat -ano | findstr :5000` (Windows) or `lsof -i :5000` (Mac/Linux)

**Socket.IO connection fails**
- Check browser console for WebSocket errors
- Verify backend is running and accessible
- Confirm CORS configuration matches frontend URL

**AI features not working**
- Test API key validity at [Google AI Studio](https://aistudio.google.com/)
- Check server logs for detailed Gemini API error messages
- Ensure meeting has content (minimum one message)

**Semantic search returns no results**
- Wait 2-3 seconds after meeting creation for embeddings to generate
- Check server logs for "Embedded X chunks for meeting [id]" confirmation
- Try broader or more specific queries based on actual meeting content

**RAG chat gives incorrect answers**
- Ensure meeting has substantial transcript content (100+ words recommended)
- Ask specific questions related to actual meeting discussions
- Check "Source Chunks" to see context the AI used

## Performance & Compatibility

**Optimizations**
- Message history pagination (200 messages per load)
- WebSocket transport for sub-100ms latency
- MongoDB indexes on frequently queried fields
- Debounced search and typing indicators
- React memo and useCallback for render optimization

**Browser Support**  
Chrome/Edge 90+, Firefox 88+, Safari 14+ (WebSocket required)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'feat: add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

ISC License

---

**Built with modern web technologies to transform meeting collaboration through AI-powered intelligence.**
