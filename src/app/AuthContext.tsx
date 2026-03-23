import React, { createContext, useContext, useState } from "react";

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

  const login = (userData: UserData) => {
    setUser(userData);
    localStorage.setItem("saberix_user", JSON.stringify(userData));
  };

  const logout = () => {
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
