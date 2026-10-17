import { supabase } from "@/lib/supabase";
import type { AiResponse, CategoryChoice, HistoryEntry } from "@/services/ai";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AppState {
  ready: boolean;
  user: User | null;
  history: HistoryEntry[];
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  addHistory: (entry: {
    category: CategoryChoice;
    text: string;
    imageUri: string | null;
    response: AiResponse;
  }) => HistoryEntry;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    // 1. Check existing session on boot
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name:
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "User",
          email: session.user.email || "",
        });
      }
      setReady(true);
    });

    // 2. Listen to session state changes (Login, Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            name:
              session.user.user_metadata?.name ||
              session.user.email?.split("@")[0] ||
              "User",
            email: session.user.email || "",
          });
        } else {
          setUser(null);
          setHistory([]);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();

        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: password,
          options: {
            data: {
              name: trimmedName,
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (!data.user) {
          return { success: false, error: "Failed to create user account." };
        }

        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || "An unexpected error occurred.",
        };
      }
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const trimmedEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password,
      });

      if (error || !data.user) {
        return {
          success: false,
          error: error?.message || "Invalid credentials.",
        };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "An unexpected error occurred.",
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHistory([]);
  }, []);

  const addHistory = useCallback<AppState["addHistory"]>((entry) => {
    const full: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      ...entry,
    };
    setHistory((prev) => [full, ...prev]);
    return full;
  }, []);

  const value = useMemo(
    () => ({ ready, user, history, signUp, signIn, signOut, addHistory }),
    [ready, user, history, signUp, signIn, signOut, addHistory],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}
