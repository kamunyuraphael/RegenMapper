// src/context/AuthContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import * as api from '../services/api';
import type { AuthUser } from '../services/api';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  // Replace the signed-in user's cached details (after a profile edit or email verification).
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => api.getSession()?.user ?? null);

  const signup = async (email: string, password: string) => {
    const session = await api.signup(email, password);
    api.setSession(session);
    setUser(session.user);
  };

  const login = async (email: string, password: string) => {
    const session = await api.login(email, password);
    api.setSession(session);
    setUser(session.user);
  };

  const logout = () => {
    api.clearSession();
    setUser(null);
  };

  const updateUser = (next: AuthUser) => {
    const session = api.getSession();
    if (session) api.setSession({ ...session, user: next });
    setUser(next);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signup, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
