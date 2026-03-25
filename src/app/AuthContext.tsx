import React, { createContext, useContext, useState, useEffect, useRef } from "react";

const API = "https://finalproyect-production-3837.up.railway.app";

export interface UserData {
  id:          number;
  nombre:      string;
  email:       string;
  foto?:       string | null;
  bio?:        string | null;
  pais?:       string | null;
  created_at?: string;
}

interface AuthContextType {
  user:   UserData | null;
  login:  (userData: UserData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user:   null,
  login:  () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(() => {
    try {
      const stored = localStorage.getItem("saberix_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Heartbeat: mantiene al usuario marcado como online ── */
  function startHeartbeat(userId: number) {
    // Enviar uno inmediatamente
    fetch(`${API}/api/auth/heartbeat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userId }),
    }).catch(() => {});

    // Luego cada 30 segundos
    heartbeatRef.current = setInterval(() => {
      fetch(`${API}/api/auth/heartbeat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId }),
      }).catch(() => {});
    }, 30_000);
  }

  function stopHeartbeat() {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }

  /* ── Si ya había sesión guardada, arrancar heartbeat ── */
  useEffect(() => {
    if (user) startHeartbeat(user.id);
    return () => stopHeartbeat();
  }, []);

  /* ── Marcar offline si cierra la pestaña/navegador ── */
  useEffect(() => {
    const markOffline = () => {
      if (!user) return;
      // navigator.sendBeacon garantiza que se envíe aunque se cierre la pestaña
      navigator.sendBeacon(
        `${API}/api/auth/logout`,
        JSON.stringify({ userId: user.id })
      );
    };
    window.addEventListener("beforeunload", markOffline);
    return () => window.removeEventListener("beforeunload", markOffline);
  }, [user]);

  const login = (userData: UserData) => {
    setUser(userData);
    localStorage.setItem("saberix_user", JSON.stringify(userData));
    startHeartbeat(userData.id);
  };

  const logout = () => {
    if (user) {
      // Marcar offline en el servidor
      fetch(`${API}/api/auth/logout`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: user.id }),
      }).catch(() => {});
    }
    stopHeartbeat();
    setUser(null);
    localStorage.removeItem("saberix_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

