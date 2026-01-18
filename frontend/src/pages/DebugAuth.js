import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function DebugAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      console.log('=== DEBUG AUTH ===');
      console.log('Token exists:', !!token);
      console.log('Token (first 50 chars):', token?.substring(0, 50));
      
      if (!token) {
        console.log('❌ No token, redirecting to login');
        navigate('/login');
        return;
      }

      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('API Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ User data:', data);
          console.log('Redirecting to dashboard in 2 seconds...');
          
          setTimeout(() => {
            navigate('/dashboard', { 
              state: { user: data },
              replace: true 
            });
          }, 2000);
        } else {
          console.log('❌ API error:', response.statusText);
          localStorage.removeItem('access_token');
          navigate('/login');
        }
      } catch (error) {
        console.error('❌ Error:', error);
        localStorage.removeItem('access_token');
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="pixel-font text-2xl text-purple-400">VERIFICANDO SESION...</div>
        <p className="text-purple-300 text-sm">Abre la consola del navegador (F12)</p>
      </div>
    </div>
  );
}

export default DebugAuth;
