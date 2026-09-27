import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { api, getAccessToken, onAuthChange, setTokens } from '@/api/client';
import { keys } from '@/api/hooks';
import type { TokenPair, UserMe } from '@/api/types';

interface AuthValue {
  user: UserMe | null;
  loading: boolean;
  signedIn: boolean;
  signIn: (identifier: string, password: string) => Promise<UserMe>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  can: (...permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(Boolean(getAccessToken()));

  const load = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.get<UserMe>('/auth/me');
      setUser(me);
      queryClient.setQueryData(keys.me, me);
    } catch {
      // A dead or revoked token: clear it rather than leaving a half state.
      setTokens(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  useEffect(() => {
    void load();
    return onAuthChange((token) => {
      if (!token) setUser(null);
    });
  }, [load]);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const tokens = await api.post<TokenPair>('/auth/login', { identifier, password });
      setTokens(tokens);
      const me = await api.get<UserMe>('/auth/me');
      setUser(me);
      queryClient.setQueryData(keys.me, me);
      return me;
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    const refreshToken = window.localStorage.getItem('cj.refresh');
    if (refreshToken) {
      // Best effort: the local session ends regardless of what the server says.
      await api.post('/auth/logout', { refresh_token: refreshToken }).catch(() => undefined);
    }
    setTokens(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const can = useCallback(
    (...permissions: string[]) => {
      if (!user) return false;
      if (user.is_superuser) return true;
      return permissions.some((permission) => user.permissions.includes(permission));
    },
    [user],
  );

  const value = useMemo<AuthValue>(
    () => ({ user, loading, signedIn: user !== null, signIn, signOut, refresh: load, can }),
    [user, loading, signIn, signOut, load, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (context === null) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
