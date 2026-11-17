'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { configureApi, loginRequest, logoutRequest, refreshRequest } from './api';
import type { PublicUser } from './types';

type AuthState = {
  user: PublicUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: PublicUser | null) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  const setAccessToken = useCallback((token: string | null) => {
    tokenRef.current = token;
    setAccessTokenState(token);
  }, []);

  useEffect(() => {
    configureApi({
      getAccessToken: () => tokenRef.current,
      setAccessToken,
      onSessionLost: () => {
        setUser(null);
        setAccessToken(null);
      },
    });
  }, [setAccessToken]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await refreshRequest();
        if (cancelled) return;
        setAccessToken(session.accessToken);
        setUser(session.user);
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setAccessToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginRequest(email, password);
      setAccessToken(result.accessToken);
      setUser(result.user);
    },
    [setAccessToken],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    setAccessToken(null);
    setUser(null);
  }, [setAccessToken]);

  const value = useMemo(
    () => ({ user, accessToken, loading, login, logout, setUser }),
    [user, accessToken, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
