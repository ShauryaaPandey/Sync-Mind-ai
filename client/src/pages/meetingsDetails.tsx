import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckSquare,
  FileText,
  Lightbulb,
  Search,
  Video
} from 'lucide-react';

import API from '../services/api';
import { TaskChecklist } from '../components/TaskCheckList';
import { SentimentBadge } from '../components/SentimentBadge';
import { socketService } from '../services/socket';

export const MeetingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    'summary' | 'tasks' | 'decisions' | 'transcript'
  >('summary');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        // Try shared access first (for collaborative meetings)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        Loading meeting...
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        Meeting not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 cursor-pointer"
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

      <div className="flex border-b border-gray-700 mb-6 gap-6">
        {[
          { id: 'summary', label: 'Summary', icon: FileText },
          {
            id: 'tasks',
            label: `Action Items (${meeting.actionItems?.length || 0})`,
            icon: CheckSquare
          },
          { id: 'decisions', label: 'Key Decisions', icon: Lightbulb },
          { id: 'transcript', label: 'Full Transcript', icon: Search }
        ].map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(
                  tab.id as 'summary' | 'tasks' | 'decisions' | 'transcript'
                )
              }
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition cursor-pointer ${
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
          <p>{meeting.summary}</p>
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
          {meeting.keyDecisions?.map((decision: string, index: number) => (
            <div
              key={index}
              className="p-4 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
            >
              💡 {decision}
            </div>
          ))}
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
            {meeting.transcript
              .split('\n')
              .filter((line: string) =>
                line.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((line: string, i: number) => (
                <p key={i} className="mb-2">
                  {line}
                </p>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};