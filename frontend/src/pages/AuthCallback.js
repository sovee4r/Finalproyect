import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        // Get session_id from URL fragment
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          navigate('/login');
          return;
        }

        // Exchange session_id for session_token
        const response = await axios.get(`${API}/auth/session`, {
          headers: {
            'X-Session-ID': sessionId
          },
          withCredentials: true
        });

        // Navigate to dashboard with user data
        navigate('/dashboard', { 
          state: { user: response.data.user },
          replace: true 
        });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
      }
    };

    processSession();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="pixel-font text-2xl text-purple-400 mb-4">AUTENTICANDO...</div>
        <div className="w-16 h-16 border-4 border-purple-500 border-t-pink-500 rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}

export default AuthCallback;