import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthUser, Client } from '../types';

export const SUPER_ADMIN_NAME = 'Juan Técnico';
const SUPER_ADMIN_USER: AuthUser = { id: 'user-super-admin', name: SUPER_ADMIN_NAME, role: 'super_admin' };

interface AuthContextValue {
  currentUser: AuthUser | null;
  loginAsSuperAdmin: () => void;
  loginAsClient: (client: Client) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_KEY = 'dentalflow.auth.v1';

const safeRead = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => safeRead(AUTH_KEY, null));

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
    } else {
      window.localStorage.removeItem(AUTH_KEY);
    }
  }, [currentUser]);

  const value = useMemo<AuthContextValue>(() => ({
    currentUser,
    loginAsSuperAdmin: () => setCurrentUser(SUPER_ADMIN_USER),
    loginAsClient: (client: Client) => {
      if (!client.active) return false;
      setCurrentUser({ id: `user-${client.id}`, name: client.name, role: 'client_admin', clientId: client.id });
      return true;
    },
    logout: () => setCurrentUser(null),
  }), [currentUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
};
