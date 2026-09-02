import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import API from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewMeetingModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
          <h3 className="text-xl font-bold">Process New Meeting with AI</h3>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded transition flex items-center justify-center gap-2"
          >
            {loading ? 'AI is Analyzing...' : 'Generate Notes & Tasks'}
          </button>
        </form>
      </div>
    </div>
  );
};