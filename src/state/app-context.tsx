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
  }) => Promise<HistoryEntry>;
}

const Ctx = createContext<AppState | null>(null);

/**
 * 1. Uploads local image URI to private Supabase Storage bucket 'history-images'
 * Returns the raw file path (e.g., "user_id/123456.jpg") for secure storage.
 */
async function uploadImageToSupabase(
  uri: string,
  userId: string,
): Promise<string | null> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    let fileExt = "jpg";
    if (uri.startsWith("data:")) {
      const match = uri.match(/data:image\/([a-zA-Z0-9+]+);/);
      if (match && match[1]) {
        fileExt = match[1] === "jpeg" ? "jpg" : match[1];
      }
    } else {
      const cleanUri = uri.split("?")[0];
      const ext = cleanUri.split(".").pop();
      if (ext && ext.length <= 5) {
        fileExt = ext;
      }
    }

    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("history-images")
      .upload(filePath, blob, {
        contentType: blob.type || `image/${fileExt}`,
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error.message);
      return null;
    }

    return data.path;
  } catch (err) {
    console.error("Failed to upload image to Supabase storage:", err);
    return null;
  }
}

/**
 * 2. Generates a temporary, owner-restricted Signed URL from a private storage path.
 */
async function resolveImageUri(
  imageRef: string | null,
): Promise<string | null> {
  if (!imageRef) return null;

  // If it's a local device URI, keep it
  if (
    imageRef.startsWith("file:") ||
    imageRef.startsWith("data:") ||
    imageRef.startsWith("blob:")
  ) {
    return imageRef;
  }

  // Clean path if an old public URL format happens to linger in the database
  let path = imageRef;
  if (imageRef.includes("/history-images/")) {
    path = imageRef.split("/history-images/").pop() || imageRef;
  }

  // Request a temporary signed URL valid for 1 hour
  const { data, error } = await supabase.storage
    .from("history-images")
    .createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) {
    console.warn("Could not generate signed URL:", error?.message);
    return null;
  }

  return data.signedUrl;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const userId = user?.id;

  // Load the signed-in user's saved history and resolve private signed image URLs
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    supabase
      .from("history")
      .select(
        "id, created_at, category, submitted_text, image_reference, ai_response",
      )
      .order("created_at", { ascending: false })
      .then(async ({ data, error }) => {
        if (cancelled || error || !data) {
          if (error) console.error("Error fetching history:", error.message);
          return;
        }

        const mapped: HistoryEntry[] = await Promise.all(
          data.map(async (r) => ({
            id: r.id,
            createdAt: r.created_at,
            category: r.category as CategoryChoice,
            text: r.submitted_text || "",
            imageUri: await resolveImageUri(r.image_reference), // Resolves secure signed URL
            response: r.ai_response,
          })),
        );

        if (!cancelled) {
          setHistory(mapped);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
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

  const addHistory = useCallback<AppState["addHistory"]>(
    async (entry) => {
      let uploadedFilePath: string | null = null;

      if (entry.imageUri && user?.id) {
        uploadedFilePath = await uploadImageToSupabase(entry.imageUri, user.id);
      }

      const imageRef = uploadedFilePath || entry.imageUri;

      const { data, error } = await supabase
        .from("history")
        .insert({
          user_id: user?.id,
          category: entry.category,
          submitted_text: entry.text,
          image_reference: imageRef,
          ai_response: entry.response,
        })
        .select("id, created_at")
        .single();

      if (error) {
        console.warn("Failed to save history:", error.message);
      }

      const full: HistoryEntry = {
        id:
          data?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: data?.created_at || new Date().toISOString(),
        category: entry.category,
        text: entry.text,
        imageUri: await resolveImageUri(imageRef), // Convert path to a signed URL for immediate preview
        response: entry.response,
      };

      setHistory((prev) => [full, ...prev]);
      return full;
    },
    [user?.id],
  );

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
