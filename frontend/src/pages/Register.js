import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, {
        username,
        email,
        password
      });

      console.log('[Register] Response received');
      const token = response.data.access_token;

      // Try both storage methods
      try {
        localStorage.setItem('access_token', token);
        sessionStorage.setItem('access_token', token);
        console.log('[Register] Token saved');
        
        // Verify it was saved
        const verify = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        console.log('[Register] Token verified:', !!verify);
        
        if (!verify) {
          throw new Error('Could not save token');
        }
        
        // Wait and redirect
        setTimeout(() => {
          console.log('[Register] Redirecting...');
          window.location.href = '/dashboard';
        }, 200);
        
      } catch (storageError) {
        console.error('[Register] Storage error:', storageError);
        setError('Error: Tu navegador está bloqueando el almacenamiento. Usa modo normal (no incógnito).');
        setLoading(false);
      }
      
    } catch (err) {
      console.error('[Register] Register error:', err);
      setError(err.response?.data?.detail || 'Error al registrarse');
      setLoading(false);
    }
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
          REGISTRO
        </h1>

        {error && (
          <div className="bg-red-900/50 border-4 border-red-500 p-3 mb-4 text-center" data-testid="error-message">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="username-input" className="pixel-font text-xs text-purple-300 block mb-2">USUARIO</label>
            <input
              id="username-input"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900 border-4 border-purple-400 px-4 py-3 text-white focus:outline-none focus:border-pink-400"
              required
              data-testid="username-input"
            />
          </div>

          <div>
            <label htmlFor="email-input-register" className="pixel-font text-xs text-purple-300 block mb-2">EMAIL</label>
            <input
              id="email-input-register"
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
            <label htmlFor="password-input-register" className="pixel-font text-xs text-purple-300 block mb-2">CONTRASEÑA</label>
            <input
              id="password-input-register"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border-4 border-purple-400 px-4 py-3 text-white focus:outline-none focus:border-pink-400"
              required
              minLength="6"
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
            data-testid="register-button"
          >
            {loading ? 'CARGANDO...' : '&gt; REGISTRAR &lt;'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-purple-400 hover:text-pink-400 text-sm">
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;