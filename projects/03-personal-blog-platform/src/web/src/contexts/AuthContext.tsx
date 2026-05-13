/**
 * AuthContext — Google Identity Services (GIS) integration.
 *
 * Provides: user state, signIn / signOut actions, and Bearer token for API calls.
 * Also keeps adminApi.ts in sync via setAuthToken().
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { setAuthToken } from "../lib/adminApi";

// ── Types ──────────────────────────────────────────────────────

export interface AuthUser {
  email: string;
  role: "admin" | "user";
  isAdmin: boolean;
  features: string[];
  name: string | null;
  picture: string | null;
  idToken: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  gisReady: boolean;
  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  signIn: () => void;
  signOut: () => Promise<void>;
}

// Extend Window for GIS SDK
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (opts: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (momentListener?: (n: unknown) => void) => void;
          revoke: (email: string, done: () => void) => void;
          disableAutoSelect: () => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              locale?: string;
              width?: string | number;
            },
          ) => void;
        };
      };
    };
  }
}

// ── Session persistence helpers ──────────────────────────────

const SESSION_KEY = "blog_auth_session";

function jwtExp(token: string): number {
  try {
    return (
      (JSON.parse(atob(token.split(".")[1])) as { exp: number }).exp * 1000
    );
  } catch {
    return 0;
  }
}

function saveSession(u: AuthUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(u));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as AuthUser;
    // Validate: token must not be expired
    if (Date.now() > jwtExp(u.idToken)) {
      clearSession();
      return null;
    }
    return u;
  } catch {
    return null;
  }
}

// ── Context ────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  gisReady: false,
  loginModalOpen: false,
  openLoginModal: () => {},
  closeLoginModal: () => {},
  signIn: () => {},
  signOut: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

// ── Provider ───────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [gisReady, setGisReady] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const openLoginModal = useCallback(() => setLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setLoginModalOpen(false), []);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setUser(saved);
      setAuthToken(saved.idToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user?.idToken) return;

    const expiresAt = jwtExp(user.idToken);
    if (!expiresAt || Date.now() >= expiresAt) {
      setUser(null);
      setAuthToken(null);
      clearSession();
      return;
    }

    const timeoutMs = Math.max(expiresAt - Date.now() - 30_000, 0);
    const timer = window.setTimeout(() => {
      setUser(null);
      setAuthToken(null);
      clearSession();
    }, timeoutMs);

    return () => window.clearTimeout(timer);
  }, [user?.idToken]);

  // Callback invoked by GIS after user consents
  const handleCredential = useCallback(
    async (response: { credential: string }) => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: response.credential }),
        });
        if (!res.ok) throw new Error("Login failed");
        const data = (await res.json()) as {
          email: string;
          role: "admin" | "user";
          isAdmin: boolean;
          features: string[];
          name: string | null;
          picture: string | null;
        };
        const authedUser: AuthUser = { ...data, idToken: response.credential };
        setUser(authedUser);
        setAuthToken(response.credential);
        saveSession(authedUser); // persist across page loads
        setLoginModalOpen(false); // auto-close modal after successful login
      } catch (e) {
        console.error("[Auth] Login error:", e);
      }
    },
    [],
  );

  // Load GIS script and initialise
  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    function initGis() {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId!,
        callback: handleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      setGisReady(true);
      setLoading(false);
    }

    const scriptId = "gis-sdk";
    if (document.getElementById(scriptId)) {
      // Already injected — might or might not be loaded yet
      if (window.google) {
        initGis();
      } else {
        document.getElementById(scriptId)!.addEventListener("load", initGis);
      }
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGis;
    script.onerror = () => setLoading(false);
    document.head.appendChild(script);
  }, [clientId, handleCredential]);

  const signIn = useCallback(() => {
    if (!window.google || !gisReady) return;
    window.google.accounts.id.prompt();
  }, [gisReady]);

  const signOut = useCallback(async () => {
    if (window.google && user?.email) {
      window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.revoke(user.email, () => {});
    }
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setAuthToken(null);
    clearSession();
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        gisReady,
        loginModalOpen,
        openLoginModal,
        closeLoginModal,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
