"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getToken, setToken } from "@/lib/api";
import { authApi, usersApi } from "@/lib/services";
import type { LoginRequest, RegisterRequest, User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const current = getToken();
    if (!current) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await usersApi.me();
      setUser(me);
      setTokenState(current);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Bootstrapping auth state on mount sets state synchronously by design.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const onExpired = () => {
      setToken(null);
      setTokenState(null);
      setUser(null);
      router.replace("/login");
    };
    window.addEventListener("ams:session-expired", onExpired);
    return () => window.removeEventListener("ams:session-expired", onExpired);
  }, [router]);

  const login = useCallback(
    async (data: LoginRequest) => {
      const result = await authApi.login(data);
      setToken(result.token);
      setTokenState(result.token);
      setUser(result.user);
      router.replace("/dashboard");
    },
    [router],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const result = await authApi.register(data);
      if (result?.token) {
        setToken(result.token);
        setTokenState(result.token);
        setUser(result.user);
        router.replace("/dashboard");
      } else {
        await login(data);
      }
    },
    [login, router],
  );

  const logout = useCallback(() => {
    setToken(null);
    setTokenState(null);
    setUser(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
