import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './app.routes';
import { AuthProvider, useAuth } from './AuthContext';
import './i18n-config'; // Inicializa i18next

function GoogleAuthHandler({ children }: { children: React.ReactNode }) {
  const { login } = useAuth();
  useEffect(() => {
    const params     = new URLSearchParams(window.location.search);
    const googleUser = params.get('google_user');
    if (googleUser) {
      try {
        const userData = JSON.parse(decodeURIComponent(googleUser));
        login(userData);
        window.history.replaceState({}, '', '/');
      } catch { console.error('Error parsing google_user'); }
    }
  }, []);
  return <>{children}</>;
}

function App() {
  // Aplicar configuraciones guardadas al iniciar
  useEffect(() => {
    const hc = localStorage.getItem('settings_highContrast') === 'true';
    document.body.classList.toggle('high-contrast', hc);

    const rm = localStorage.getItem('settings_reducedMotion') === 'true';
    if (rm) {
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');
    }
  }, []);

  return (
    <AuthProvider>
      <GoogleAuthHandler>
        <RouterProvider router={router} />
      </GoogleAuthHandler>
    </AuthProvider>
  );
}

export default App;
