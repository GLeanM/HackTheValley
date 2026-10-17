import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { AiResponse, CategoryChoice, HistoryEntry } from '@/services/ai';

/**
 * Temporary prototype persistence (AsyncStorage) + mock auth.
 * Replace with Supabase auth/tables later; only this file needs to change.
 */
export interface User {
  name: string;
  email: string;
}

interface AppState {
  ready: boolean;
  user: User | null;
  history: HistoryEntry[]; // newest first
  signIn: (user: User) => Promise<void>;
  signOut: () => Promise<void>;
  addHistory: (entry: { category: CategoryChoice; text: string; imageUri: string | null; response: AiResponse }) => HistoryEntry;
}

const USER_KEY = 'relast:user';
const historyKey = (email: string) => `relast:history:${email.toLowerCase()}`;

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_KEY);
        if (raw) {
          const u = JSON.parse(raw) as User;
          setUser(u);
          const h = await AsyncStorage.getItem(historyKey(u.email));
          if (h) setHistory(JSON.parse(h) as HistoryEntry[]);
        }
      } catch {
        // Corrupt/unavailable storage: start fresh.
      }
      setReady(true);
    })();
  }, []);

  const signIn = useCallback(async (u: User) => {
    let saved: HistoryEntry[] = [];
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
      const h = await AsyncStorage.getItem(historyKey(u.email));
      if (h) saved = JSON.parse(h) as HistoryEntry[];
    } catch {}
    setHistory(saved);
    setUser(u);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(USER_KEY); // history stays saved for next login
    } catch {}
    setUser(null);
    setHistory([]);
  }, []);

  const addHistory = useCallback<AppState['addHistory']>(
    (entry) => {
      const full: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        ...entry,
      };
      setHistory((prev) => {
        const next = [full, ...prev];
        if (user) AsyncStorage.setItem(historyKey(user.email), JSON.stringify(next)).catch(() => {});
        return next;
      });
      return full;
    },
    [user],
  );

  const value = useMemo(
    () => ({ ready, user, history, signIn, signOut, addHistory }),
    [ready, user, history, signIn, signOut, addHistory],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}
