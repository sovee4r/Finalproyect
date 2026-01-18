import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password
      });

      console.log('[Login] Response received');
      const token = response.data.access_token;
      
      // Try both storage methods
      try {
        localStorage.setItem('access_token', token);
        sessionStorage.setItem('access_token', token);
        console.log('[Login] Token saved');
        
        // Verify it was saved
        const verify = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        console.log('[Login] Token verified:', !!verify);
        
        if (!verify) {
          throw new Error('Could not save token');
        }
        
        // Wait a bit and redirect
        setTimeout(() => {
          console.log('[Login] Redirecting...');
          window.location.href = '/dashboard';
        }, 200);
        
      } catch (storageError) {
        console.error('[Login] Storage error:', storageError);
        setError('Error: Tu navegador está bloqueando el almacenamiento. Usa modo normal (no incógnito).');
        setLoading(false);
      }
      
    } catch (err) {
      console.error('[Login] Login error:', err);
      setError(err.response?.data?.detail || 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 pixel-bg flex items-center justify-center p-6">
      <div className="bg-slate-800/90 border-8 border-purple-500 p-8 max-w-md w-full pixel-dither" style={{
        boxShadow: '8px 8px 0 0 #a855f7, 16px 16px 0 0 #ec4899',
        imageRendering: 'pixelated'
      }}>
        <h1 className="pixel-font text-2xl text-purple-400 text-center mb-8 leading-loose" style={{
          textShadow: '3px 3px 0 #ec4899',
          imageRendering: 'pixelated'
        }}>
          INICIAR SESION
        </h1>

        {error && (
          <div className="bg-red-900/50 border-4 border-red-500 p-3 mb-4 text-center" data-testid="error-message">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email-input" className="pixel-font text-xs text-purple-300 block mb-2">EMAIL</label>
            <input
              id="email-input"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border-4 border-purple-400 px-4 py-3 text-white focus:outline-none focus:border-pink-400"
              required
              data-testid="email-input"
            />
          </div>

          <div>
            <label htmlFor="password-input" className="pixel-font text-xs text-purple-300 block mb-2">CONTRASEÑA</label>
            <input
              id="password-input"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border-4 border-purple-400 px-4 py-3 text-white focus:outline-none focus:border-pink-400"
              required
              data-testid="password-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="pixel-font w-full px-6 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-700 hover:via-pink-700 hover:to-fuchsia-700 text-white border-4 border-fuchsia-400 text-xs leading-relaxed disabled:opacity-50"
            style={{
              boxShadow: '6px 6px 0 0 #ec4899',
              imageRendering: 'pixelated'
            }}
            data-testid="login-button"
          >
            {loading ? 'CARGANDO...' : '&gt; ENTRAR &lt;'}
          </button>
        </form>

        <div className="my-6 text-center">
          <p className="text-purple-300 text-sm">- O -</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="pixel-font w-full px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white border-4 border-purple-500 text-xs leading-relaxed"
          style={{
            boxShadow: '6px 6px 0 0 #a855f7',
            imageRendering: 'pixelated'
          }}
          data-testid="google-login-button"
        >
          GOOGLE LOGIN
        </button>

        <div className="mt-6 text-center">
          <Link to="/register" className="text-purple-400 hover:text-pink-400 text-sm">
            ¿No tienes cuenta? Regístrate
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;