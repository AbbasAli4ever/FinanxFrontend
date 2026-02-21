"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { getMyPermissions } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

interface PermissionRole {
  id: string;
  code: string;
  name: string;
}

interface PermissionsContextType {
  permissions: string[];
  isPrimaryAdmin: boolean;
  role: PermissionRole | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined
);

const PERMISSIONS_STORAGE_KEY = "finanx_user_permissions";

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, isAuthenticated, isReady } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isPrimaryAdmin, setIsPrimaryAdmin] = useState(false);
  const [role, setRole] = useState<PermissionRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!token) {
      setPermissions([]);
      setIsPrimaryAdmin(false);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getMyPermissions(token);
      setPermissions(response.data.permissions);
      setIsPrimaryAdmin(response.data.isPrimaryAdmin);
      setRole(response.data.role);

      // Cache permissions in sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          PERMISSIONS_STORAGE_KEY,
          JSON.stringify({
            permissions: response.data.permissions,
            isPrimaryAdmin: response.data.isPrimaryAdmin,
            role: response.data.role,
          })
        );
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      setPermissions([]);
      setIsPrimaryAdmin(false);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load cached permissions on mount for faster initial render
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(PERMISSIONS_STORAGE_KEY);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setPermissions(data.permissions || []);
          setIsPrimaryAdmin(data.isPrimaryAdmin || false);
          setRole(data.role || null);
        } catch {
          // Invalid cache, ignore
        }
      }
    }
  }, []);

  // Fetch permissions when auth state is ready and user is authenticated
  useEffect(() => {
    if (!isReady) return;

    if (isAuthenticated && token) {
      fetchPermissions();
    } else {
      // Clear permissions when not authenticated
      setPermissions([]);
      setIsPrimaryAdmin(false);
      setRole(null);
      setLoading(false);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(PERMISSIONS_STORAGE_KEY);
      }
    }
  }, [isReady, isAuthenticated, token, fetchPermissions]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (isPrimaryAdmin) return true;
      return permissions.includes(permission);
    },
    [permissions, isPrimaryAdmin]
  );

  const hasAnyPermission = useCallback(
    (perms: string[]): boolean => {
      if (isPrimaryAdmin) return true;
      return perms.some((p) => permissions.includes(p));
    },
    [permissions, isPrimaryAdmin]
  );

  const hasAllPermissions = useCallback(
    (perms: string[]): boolean => {
      if (isPrimaryAdmin) return true;
      return perms.every((p) => permissions.includes(p));
    },
    [permissions, isPrimaryAdmin]
  );

  const contextValue = useMemo(
    () => ({
      permissions,
      isPrimaryAdmin,
      role,
      loading,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      refreshPermissions: fetchPermissions,
    }),
    [
      permissions,
      isPrimaryAdmin,
      role,
      loading,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      fetchPermissions,
    ]
  );

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = (): PermissionsContextType => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error(
      "usePermissions must be used within a PermissionsProvider"
    );
  }
  return context;
};
