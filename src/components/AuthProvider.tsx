"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/lib/user";

type AuthContextValue = {
  user: AuthUser | null;
  /** true dopóki nie sprawdzimy sesji po raz pierwszy */
  loading: boolean;
  /** ponownie pobiera /api/auth/me i aktualizuje stan */
  refresh: () => Promise<AuthUser | null>;
  /** wylogowuje i czyści stan */
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const next = res.ok ? ((await res.json()) as AuthUser) : null;
      setUser(next);
      return next;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Sprawdzenie sesji po stronie klienta przy pierwszym renderze. Stan aktualizuje się
    // dopiero po odpowiedzi z /api/auth/me (asynchronicznie), więc nie ma tu kaskady renderów.
    // Świadomie nie robimy tego w komponencie serwerowym — inaczej całą stronę marketingową
    // straciłaby renderowanie statyczne.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() musi być użyte wewnątrz <AuthProvider>");
  }
  return ctx;
}
