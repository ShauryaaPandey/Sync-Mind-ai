import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { MeetingDetails } from './pages/meetingsDetails';
import { Analytics } from './pages/Analytics';
import { MeetingRoom } from './pages/MeetingRoom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/meetings/:id" element={<MeetingDetails />} />
        <Route path="/meetings/:id/room" element={<MeetingRoom />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;