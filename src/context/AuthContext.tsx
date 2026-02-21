"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getMe, login as loginRequest, register as registerRequest } from "@/services/authService";
import type { AuthUser, LoginRequest, RegisterRequest } from "@/types/auth";

const ACCESS_TOKEN_KEY = "finanx_access_token";
const REFRESH_TOKEN_KEY = "finanx_refresh_token";

const getStoredToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initialToken = getStoredToken();
  const [token, setToken] = useState<string | null>(initialToken);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(initialToken === null);

  const storeTokens = useCallback(
    (accessToken: string, refreshToken: string) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      setToken(accessToken);
      setIsReady(false);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
    setToken(null);
    setIsReady(true);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    if (!token) {
      return;
    }

    getMe(token)
      .then((response) => {
        if (!isCancelled) {
          setUser(response.data);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          logout();
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsReady(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [token, logout]);

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await loginRequest(payload);
    storeTokens(response.data.accessToken, response.data.refreshToken);
    setUser({
      ...response.data.user,
      company: response.data.company,
      permissions: response.data.permissions,
    });
  }, [storeTokens]);

  const register = useCallback(async (payload: RegisterRequest) => {
    const response = await registerRequest(payload);
    storeTokens(response.data.accessToken, response.data.refreshToken);
    setUser({
      ...response.data.user,
      company: response.data.company,
      permissions: response.data.permissions,
    });
  }, [storeTokens]);

  const contextValue = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isReady,
      login,
      register,
      logout,
    }),
    [isReady, login, logout, register, token, user]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
