import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckSquare,
  FileText,
  Lightbulb,
  Search,
  Video,
  MessageSquare,
  Send,
  AlertCircle
} from 'lucide-react';

import API, { chatWithMeeting } from '../services/api';
import { TaskChecklist } from '../components/TaskCheckList';
import { SentimentBadge } from '../components/SentimentBadge';
import { socketService } from '../services/socket';

interface QAPair {
  question: string;
  answer: string;
  isError?: boolean;
  sourceChunks?: Array<{ text: string; score: number }>;
}

export const MeetingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    'summary' | 'tasks' | 'decisions' | 'transcript' | 'chat'
  >('summary');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState<QAPair[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const res = await API.get(`/meetings/${id}/shared`);
        setMeeting(res.data);
      } catch (err) {
        console.error('Failed to load meeting details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();

    if (id) {
      socketService.connect();
      socketService.joinMeeting(id);
    }

    return () => {
      if (id) {
        socketService.leaveMeeting(id);
      }
    };
  }, [id]);

  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isAsking, activeTab]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentQuestion.trim() || !id || isAsking) return;

    const question = currentQuestion.trim();
    setCurrentQuestion('');
    setIsAsking(true);

    try {
      const res = await chatWithMeeting(id, question);
      setChatHistory([...chatHistory, {
        question,
        answer: res.data.answer,
        sourceChunks: res.data.sourceChunks,
        isError: false
      }]);
    } catch (err: any) {
      setChatHistory([...chatHistory, {
        question,
        answer: err.response?.data?.message || 'Failed to get answer. Please try again.',
        isError: true
      }]);
    } finally {
      setIsAsking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-400">Loading meeting...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-2xl mx-auto text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">Meeting not found</h2>
          <p className="text-gray-400 mb-6">This meeting may have been deleted or you don't have access to it.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 cursor-pointer transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-start mb-4 gap-4">
          <h1 className="text-2xl font-bold">{meeting.title}</h1>

          <div className="flex items-center gap-3">
            <SentimentBadge sentiment={meeting.sentiment} />

            <button
              onClick={() => navigate(`/meetings/${meeting._id}/room`)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
            >
              <Video className="w-4 h-4" />
              Live Room
            </button>
          </div>
        </div>

        <p className="text-gray-400 text-sm">
          {new Date(meeting.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="flex border-b border-gray-700 mb-6 gap-6 overflow-x-auto">
        {[
          { id: 'summary', label: 'Summary', icon: FileText },
          {
            id: 'tasks',
            label: `Action Items (${meeting.actionItems?.length || 0})`,
            icon: CheckSquare
          },
          { id: 'decisions', label: 'Key Decisions', icon: Lightbulb },
          { id: 'transcript', label: 'Full Transcript', icon: Search },
          { id: 'chat', label: 'Ask AI', icon: MessageSquare }
        ].map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(
                  tab.id as 'summary' | 'tasks' | 'decisions' | 'transcript' | 'chat'
                )
              }
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'summary' && (
        <div className="bg-gray-800/60 border border-gray-700 p-6 rounded-xl text-gray-300 leading-relaxed">
          <h3 className="text-lg font-semibold text-white mb-3">
            Executive Summary
          </h3>
          <p>{meeting.summary || 'No summary available yet.'}</p>
        </div>
      )}

      {activeTab === 'tasks' && (
        <TaskChecklist
          meetingId={meeting._id}
          initialTasks={meeting.actionItems}
        />
      )}

      {activeTab === 'decisions' && (
        <div className="space-y-3">
          {meeting.keyDecisions && meeting.keyDecisions.length > 0 ? (
            meeting.keyDecisions.map((decision: string, index: number) => (
              <div
                key={index}
                className="p-4 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
              >
                {decision}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No key decisions recorded yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'transcript' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search transcript keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-gray-800/40 border border-gray-700 p-5 rounded-xl text-gray-300 font-mono text-sm leading-relaxed max-h-96 overflow-y-auto">
            {meeting.transcript && meeting.transcript.trim() ? (
              meeting.transcript
                .split('\n')
                .filter((line: string) =>
                  line.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((line: string, i: number) => (
                  <p key={i} className="mb-2">
                    {line}
                  </p>
                ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No transcript available yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden flex flex-col" style={{ height: '500px' }}>
          <div className="p-4 border-b border-gray-700 bg-gray-800/50">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              Ask questions about this meeting
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              AI will answer based on the meeting transcript using RAG
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 && !isAsking && (
              <div className="text-center text-gray-500 py-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="mb-2">No questions yet. Ask anything about this meeting.</p>
                <p className="text-xs text-gray-600">Example: "What were the main action items?" or "Who is responsible for deployment?"</p>
              </div>
            )}

            {chatHistory.map((qa, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-indigo-600 px-4 py-2 rounded-lg rounded-br-sm max-w-[80%]">
                    <p className="text-sm font-medium">{qa.question}</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className={`px-4 py-2 rounded-lg rounded-bl-sm max-w-[80%] ${
                    qa.isError ? 'bg-red-900/30 border border-red-700' : 'bg-gray-700 border border-gray-600'
                  }`}>
                    {qa.isError && (
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-red-400 font-medium">Error</span>
                      </div>
                    )}
                    <p className="text-sm text-gray-200">{qa.answer}</p>
                    {qa.sourceChunks && qa.sourceChunks.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        Based on {qa.sourceChunks.length} relevant passage(s)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isAsking && (
              <div className="flex justify-start">
                <div className="bg-gray-700 border border-gray-600 px-4 py-2 rounded-lg rounded-bl-sm">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animation-delay-200"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animation-delay-400"></div>
                    </div>
                    <p className="text-sm text-gray-400">Thinking...</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleAskQuestion} className="p-4 border-t border-gray-700 bg-gray-800/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                placeholder="Ask a question about this meeting..."
                disabled={isAsking}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              />
              <button
                type="submit"
                disabled={!currentQuestion.trim() || isAsking}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition"
                title={!currentQuestion.trim() ? 'Enter a question first' : 'Send question'}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Press Enter to send</p>
          </form>
        </div>
      )}
    </div>
  );
};