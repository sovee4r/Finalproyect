import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import GameRoom from './pages/GameRoom';
import DebugAuth from './pages/DebugAuth';
import { useLocation } from 'react-router-dom';

function AppRouter() {
  const location = useLocation();
  
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  // Check URL fragment for session_id (synchronously during render)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/room/:roomId" element={<GameRoom />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </div>
  );
}

export default App;