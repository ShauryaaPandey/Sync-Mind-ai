import { useState, useEffect } from 'react';
import { Plus, FileText, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { NewMeetingModal } from '../components/NewMeetingModal';
import { socketService } from '../services/socket';

export const Dashboard = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchMeetings = async () => {
    try {
      const res = await API.get('/meetings');
      setMeetings(res.data);
    } catch (err) {
      console.error('Failed to fetch meetings', err);
    }
  };

  useEffect(() => {
    fetchMeetings();
    socketService.connect();
    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">SyncMind AI Dashboard</h1>
            <p className="text-gray-400 mt-1">AI-extracted meeting summaries & action items</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition font-medium cursor-pointer"
          >
            <Plus className="w-5 h-5" /> New Meeting
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meeting) => (
            <div
              key={meeting._id}
              onClick={() => navigate(`/meetings/${meeting._id}`)}
              className="bg-gray-800 border border-gray-700 p-5 rounded-xl cursor-pointer hover:border-indigo-500/50 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    meeting.sentiment === 'Positive' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    meeting.sentiment === 'Negative' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {meeting.sentiment}
                  </span>
                  <span className="text-xs text-gray-500">{new Date(meeting.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-bold mb-2 line-clamp-1">{meeting.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-3 mb-4">{meeting.summary}</p>
              </div>

              <div className="border-t border-gray-700/60 pt-3 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> {meeting.actionItems?.length || 0} Tasks</span>
                <span className="flex items-center gap-1"><FileText className="w-4 h-4 text-indigo-400" /> Key Decisions ({meeting.keyDecisions?.length || 0})</span>
              </div>
            </div>
          ))}
        </div>

        {meetings.length === 0 && (
          <div className="text-center py-16 bg-gray-800/50 border border-gray-700/50 rounded-xl">
            <p className="text-gray-400 text-lg mb-4">No meetings processed yet.</p>
            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg cursor-pointer">
              Process First Meeting
            </button>
          </div>
        )}
      </div>

      <NewMeetingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchMeetings}
      />
    </div>
  );
};