import { useState, useEffect } from 'react';
import { CheckCircle, FileText, Smile } from 'lucide-react';
import API from '../services/api';
import { Navbar } from '../components/Navbar';

export const Analytics = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    API.get('/analytics')
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));
  }, []);

  if (!stats) return <div className="min-h-screen bg-gray-900 text-white p-8">Loading stats...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Team Insights & Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex items-center gap-4">
            <FileText className="w-10 h-10 text-indigo-400" />
            <div>
              <p className="text-gray-400 text-sm">Total Meetings Processed</p>
              <p className="text-2xl font-bold">{stats.totalMeetings}</p>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex items-center gap-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
            <div>
              <p className="text-gray-400 text-sm">Task Completion Rate</p>
              <p className="text-2xl font-bold">{stats.taskCompletionRate}%</p>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex items-center gap-4">
            <Smile className="w-10 h-10 text-yellow-400" />
            <div>
              <p className="text-gray-400 text-sm">Positive Meetings Ratio</p>
              <p className="text-2xl font-bold">{stats.sentimentCounts?.Positive || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};