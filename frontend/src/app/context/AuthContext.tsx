import { createContext, useContext, useState, ReactNode } from "react";

export interface AppUser {
  id: string;
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
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const MOCK_GOOGLE_USER: AppUser = {
  id: "google_001",
  name: "Nguyễn Văn An",
  email: "an.nguyen@gmail.com",
  avatarUrl: undefined,
  provider: "google",
  initials: "NA",
};

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
    setIsLoading(true);
    // Simulate OAuth round-trip
    await new Promise((r) => setTimeout(r, 1200));
    persist(MOCK_GOOGLE_USER);
    setIsLoading(false);
  };

  const loginWithEmail = async (email: string, _password: string): Promise<void> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    // Mock: accept any credentials
    const name = email.split("@")[0].replace(/[._]/g, " ");
    const formatted = name
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    const u: AppUser = {
      id: `email_${Date.now()}`,
      name: formatted,
      email,
      provider: "email",
      initials: getInitials(formatted),
    };
    persist(u);
    setIsLoading(false);
  };

  const register = async (name: string, email: string, _password: string): Promise<void> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    const u: AppUser = {
      id: `email_${Date.now()}`,
      name,
      email,
      provider: "email",
      initials: getInitials(name),
    };
    persist(u);
    setIsLoading(false);
  };

  const logout = () => {
    persist(null);
  };

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
