"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  selectCompany as selectCompanyRequest,
  switchCompany as switchCompanyRequest,
  // createCompanyWithTemp as createCompanyWithTempRequest,
} from "@/services/authService";
import type {
  AuthUser,
  CompanySelectionItem,
  LoginRequest,
  RegisterRequest,
} from "@/types/auth";

const ACCESS_TOKEN_KEY = "finanx_access_token";
const REFRESH_TOKEN_KEY = "finanx_refresh_token";
const TEMP_TOKEN_KEY = "finanx_temp_token";
const PENDING_COMPANIES_KEY = "finanx_pending_companies";

const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export interface PendingCompanySelection {
  companies: CompanySelectionItem[];
  tempToken: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  pendingCompanySelection: PendingCompanySelection | null;
  login: (payload: LoginRequest) => Promise<{ requiresCompanySelection: boolean }>;
  selectCompany: (companyId: string) => Promise<void>;
  switchCompany: (companyId: string) => Promise<void>;
  // createCompanyWithTemp: (data: { companyName: string; companyEmail?: string }) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
  storeTokens: (accessToken: string, refreshToken: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initialToken = getStoredToken();
  const [token, setToken] = useState<string | null>(initialToken);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(initialToken === null);
  // When login/selectCompany already populates user from the
  // API response, skip the redundant getMe call that the token-change effect would fire.
  const skipNextGetMe = useRef(false);
  const [pendingCompanySelection, setPendingCompanySelection] =
    useState<PendingCompanySelection | null>(() => {
      if (typeof window === "undefined") return null;
      const tempToken = localStorage.getItem(TEMP_TOKEN_KEY);
      const rawCompanies = localStorage.getItem(PENDING_COMPANIES_KEY);
      if (!tempToken || !rawCompanies) return null;
      try {
        const companies = JSON.parse(rawCompanies) as CompanySelectionItem[];
        return { companies, tempToken };
      } catch {
        return null;
      }
    });

  const storeTokens = useCallback(
    (accessToken: string, refreshToken: string) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.removeItem(TEMP_TOKEN_KEY);
      localStorage.removeItem(PENDING_COMPANIES_KEY);
      setToken(accessToken);
      setIsReady(false);
    },
    []
  );

  const logout = useCallback(() => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (storedRefreshToken) {
      logoutRequest(storedRefreshToken).catch(() => {});
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TEMP_TOKEN_KEY);
    localStorage.removeItem(PENDING_COMPANIES_KEY);
    setUser(null);
    setToken(null);
    setPendingCompanySelection(null);
    setIsReady(true);
    window.location.replace("/signin");
  }, []);

  useEffect(() => {
    if (!token) return;
    // Skip when the caller already populated user from their own API response
    if (skipNextGetMe.current) {
      skipNextGetMe.current = false;
      return;
    }

    let isCancelled = false;
    getMe(token)
      .then((response) => {
        if (!isCancelled) setUser(response.data);
      })
      .catch(() => {
        if (!isCancelled) logout();
      })
      .finally(() => {
        if (!isCancelled) setIsReady(true);
      });

    return () => {
      isCancelled = true;
    };
  }, [token, logout]);

  const login = useCallback(
    async (payload: LoginRequest): Promise<{ requiresCompanySelection: boolean }> => {
      const response = await loginRequest(payload);

      if ("data" in response && "requiresCompanySelection" in response.data && response.data.requiresCompanySelection) {
        // Multi-company flow — store temp token and surface company list
        localStorage.setItem(TEMP_TOKEN_KEY, response.data.tempToken);
        localStorage.setItem(PENDING_COMPANIES_KEY, JSON.stringify(response.data.companies));
        setPendingCompanySelection({
          companies: response.data.companies,
          tempToken: response.data.tempToken,
        });
        return { requiresCompanySelection: true };
      }

      // Single company flow — set everything directly to avoid storeTokens
      // resetting isReady=false and triggering an unnecessary getMe round-trip
      const authData = (response as import("@/types/auth").AuthResponse).data;
      localStorage.setItem(ACCESS_TOKEN_KEY, authData.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken);
      localStorage.removeItem(TEMP_TOKEN_KEY);
      localStorage.removeItem(PENDING_COMPANIES_KEY);
      skipNextGetMe.current = true;
      setToken(authData.accessToken);
      setUser({
        ...authData.user,
        company: authData.company,
        permissions: authData.permissions,
      });
      setIsReady(true);
      return { requiresCompanySelection: false };
    },
    [storeTokens]
  );

  const selectCompany = useCallback(
    async (companyId: string) => {
      const tempToken =
        pendingCompanySelection?.tempToken ??
        localStorage.getItem(TEMP_TOKEN_KEY) ??
        "";
      const response = await selectCompanyRequest(tempToken, companyId);
      const { accessToken, refreshToken, user: authUser, company, permissions } = response.data;
      // Store tokens directly — do NOT call storeTokens() which resets isReady=false
      // and triggers the getMe loop. Instead set everything in one synchronous batch.
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.removeItem(TEMP_TOKEN_KEY);
      localStorage.removeItem(PENDING_COMPANIES_KEY);
      skipNextGetMe.current = true;
      setToken(accessToken);
      setUser({ ...authUser, company, permissions });
      setPendingCompanySelection(null);
      setIsReady(true);
    },
    [pendingCompanySelection]
  );

  const switchCompany = useCallback(
    async (companyId: string) => {
      if (!token) return;
      const response = await switchCompanyRequest(token, companyId);
      const { accessToken, refreshToken, user: authUser, company, permissions } = response.data;
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      skipNextGetMe.current = true;
      setToken(accessToken);
      setUser({ ...authUser, company, permissions });
      setIsReady(true);
    },
    [token]
  );

  // const createCompanyWithTemp = useCallback(
  //   async (data: { companyName: string; companyEmail?: string }) => {
  //     const tempToken =
  //       pendingCompanySelection?.tempToken ??
  //       localStorage.getItem(TEMP_TOKEN_KEY) ??
  //       "";
  //     const response = await createCompanyWithTempRequest(tempToken, data);
  //     const { accessToken, refreshToken, user: authUser, company, permissions } = response.data;
  //     localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  //     localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  //     localStorage.removeItem(TEMP_TOKEN_KEY);
  //     localStorage.removeItem(PENDING_COMPANIES_KEY);
  //     skipNextGetMe.current = true;
  //     setToken(accessToken);
  //     setUser({ ...authUser, company, permissions });
  //     setPendingCompanySelection(null);
  //     setIsReady(true);
  //   },
  //   [pendingCompanySelection]
  // );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const response = await registerRequest(payload);
      const { accessToken, refreshToken, user: authUser, company, permissions } = response.data;
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.removeItem(TEMP_TOKEN_KEY);
      localStorage.removeItem(PENDING_COMPANIES_KEY);
      setToken(accessToken);
      setUser({ ...authUser, company, permissions });
      setIsReady(true);
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isReady,
      pendingCompanySelection,
      login,
      selectCompany,
      switchCompany,
      // createCompanyWithTemp,
      register,
      logout,
      storeTokens,
    }),
    [isReady, login, selectCompany, switchCompany, logout, register, storeTokens, token, user, pendingCompanySelection]
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
