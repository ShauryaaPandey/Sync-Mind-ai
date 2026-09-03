import { Link } from 'react-router-dom';
import { LayoutDashboard, BarChart2, LogOut } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between text-white">
      <div className="flex items-center gap-6">
        <span className="font-bold text-lg text-indigo-400">SyncMind AI</span>
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white">
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </Link>
        <Link to="/analytics" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white">
          <BarChart2 className="w-4 h-4" /> Analytics
        </Link>
      </div>
      <button
        onClick={() => {
          localStorage.removeItem('syncmind_token');
          window.location.href = '/login';
        }}
        className="text-gray-400 hover:text-red-400 text-sm flex items-center gap-1 cursor-pointer"
      >
        <LogOut className="w-4 h-4" /> Logout
      </button>
    </nav>
  );
};