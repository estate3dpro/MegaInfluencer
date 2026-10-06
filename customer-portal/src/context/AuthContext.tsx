import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type User, type CustomerProfile } from '../lib/api';

interface AuthContextType {
  user: User | null;
  profile: CustomerProfile | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: { email: string; password: string; displayName: string; phone?: string }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('advocate_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const data = await api.customer.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('advocate_token');
      if (token) {
        try {
          const meRes = await api.auth.getMe();
          setUser(meRes.user);
          await fetchProfile();
        } catch {
          api.auth.logout();
          setUser(null);
          setProfile(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setProfile(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, pass: string) => {
    const data = await api.auth.login({ email, password: pass });
    setUser(data.user);
    await fetchProfile();
  };

  const register = async (payload: { email: string; password: string; displayName: string; phone?: string }) => {
    await api.auth.register(payload);
    await login(payload.email, payload.password);
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        login,
        register,
        logout,
        refreshProfile: fetchProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
