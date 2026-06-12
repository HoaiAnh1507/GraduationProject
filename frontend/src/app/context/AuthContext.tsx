import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { backendApi } from "../api/backendApi";

export interface AppUser {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: "google" | "email";
  initials: string;
}

interface AuthContextValue {
  user: AppUser | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const OPEN_NEW_CHAT_AFTER_LOGIN = "open-new-chat-after-login";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const stored = localStorage.getItem("app-user");
      return stored ? (JSON.parse(stored) as AppUser) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const persist = (u: AppUser | null) => {
    if (u) localStorage.setItem("app-user", JSON.stringify(u));
    else localStorage.removeItem("app-user");
    setUser(u);
  };

  const loginWithGoogle = async (): Promise<void> => {
    throw new Error("Google login is not wired yet");
  };

  const loginWithEmail = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const resp = await backendApi.login({ email, password });
      sessionStorage.setItem(OPEN_NEW_CHAT_AFTER_LOGIN, "1");
      const displayName = resp.displayName || email.split("@")[0];
      persist({
        id: resp.userId,
        name: displayName,
        email: resp.email,
        provider: "email",
        initials: getInitials(displayName),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const resp = await backendApi.register({ email, password, displayName: name });
      sessionStorage.setItem(OPEN_NEW_CHAT_AFTER_LOGIN, "1");
      const displayName = resp.displayName || name || email.split("@")[0];
      persist({
        id: resp.userId,
        name: displayName,
        email: resp.email,
        provider: "email",
        initials: getInitials(displayName),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await backendApi.logout();
    persist(null);
  };

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    backendApi
      .me()
      .then((profile) => {
        if (!active) return;
        const displayName = profile.displayName || profile.username || profile.email.split("@")[0];
        persist({
          id: profile.id,
          name: displayName,
          email: profile.email,
          provider: "email",
          initials: getInitials(displayName),
        });
      })
      .catch(() => {
        if (active) persist(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithGoogle, loginWithEmail, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
