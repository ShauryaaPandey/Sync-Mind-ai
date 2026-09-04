import { useState } from 'react';
import { Sparkles, X, Video } from 'lucide-react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewMeetingModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const navigate = useNavigate();
  const [meetingType, setMeetingType] = useState<'live' | 'process'>('live');
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreateLiveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await API.post('/meetings/create', { title: title || 'New Live Meeting' });
      const meetingId = res.data.meeting._id;
      setTitle('');
      onSuccess();
      onClose();
      navigate(`/meetings/${meetingId}/room`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessTranscript = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await API.post('/meetings/process', { transcript });
      setTranscript('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg p-6 relative text-white">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          <h3 className="text-xl font-bold">New Meeting</h3>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMeetingType('live')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
              meetingType === 'live'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Video className="w-4 h-4 inline mr-1" />
            Live Meeting Room
          </button>
          <button
            onClick={() => setMeetingType('process')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
              meetingType === 'process'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-1" />
            Process Transcript
          </button>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}

        {meetingType === 'live' ? (
          <form onSubmit={handleCreateLiveMeeting} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Meeting Title (Optional)</label>
              <input
                type="text"
                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-indigo-500 text-sm"
                placeholder="e.g., Sprint Planning Meeting"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">
                Start a real-time chat room where participants can join and exchange messages live. 
                The AI will summarize the conversation when you're ready.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded transition flex items-center justify-center gap-2"
            >
              <Video className="w-4 h-4" />
              {loading ? 'Creating Room...' : 'Create Live Meeting Room'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleProcessTranscript} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Meeting Transcript or Raw Notes</label>
              <textarea
                rows={6}
                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-indigo-500 text-sm"
                placeholder="Paste your meeting notes or raw transcript here..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Upload existing meeting notes and the AI will automatically generate summaries, 
                action items, and key decisions.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded transition flex items-center justify-center gap-2"
            >
              {loading ? 'AI is Analyzing...' : 'Generate Notes & Tasks'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};