"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import ProtectedContent from "@/components/auth/ProtectedContent";
import rolesService, { Role } from "@/services/rolesService";
import { formatApiErrorMessage } from "@/utils/apiError";
import { isPermissionDeniedError, getPermissionDeniedMessage } from "@/services/apiClient";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";

type AlertState = {
  variant: "success" | "error" | "warning";
  title: string;
  message: string;
};

export default function RolesListPage() {
  const { token, isAuthenticated, isReady } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const hasAccess = Boolean(token && isAuthenticated);
  const canManageRoles = hasPermission("company:edit_settings");

  const loadRoles = useCallback(async () => {
    if (!token || !canManageRoles) return;

    setLoading(true);
    try {
      const data = await rolesService.getAllRoles(token);
      setRoles(data);
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        setAlert({
          variant: "warning",
          title: "Access Denied",
          message: getPermissionDeniedMessage(error),
        });
      } else {
        setAlert({
          variant: "error",
          title: "Unable to load roles",
          message: formatApiErrorMessage(error),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token, canManageRoles]);

  useEffect(() => {
    if (!hasAccess || permissionsLoading) return;
    if (canManageRoles) {
      loadRoles();
    } else {
      setLoading(false);
    }
  }, [hasAccess, permissionsLoading, canManageRoles, loadRoles]);

  const handleDelete = useCallback(
    async (roleId: string, roleName: string) => {
      if (!token || !canManageRoles) return;
      if (!window.confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
        return;
      }

      try {
        await rolesService.deleteRole(roleId, token);
        setAlert({
          variant: "success",
          title: "Role deleted",
          message: `The role "${roleName}" has been deleted successfully.`,
        });
        loadRoles();
      } catch (error) {
        if (isPermissionDeniedError(error)) {
          setAlert({
            variant: "warning",
            title: "Access Denied",
            message: getPermissionDeniedMessage(error),
          });
        } else {
          setAlert({
            variant: "error",
            title: "Unable to delete role",
            message: formatApiErrorMessage(error),
          });
        }
      }
    },
    [token, canManageRoles, loadRoles]
  );

  if (!isReady || permissionsLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/60">
        <div className="flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white/70 p-6 text-center text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300">
        <p className="font-semibold text-gray-900 dark:text-white/90">
          Waiting for authentication...
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sign in to view roles and permissions.
        </p>
      </div>
    );
  }

  if (!canManageRoles) {
    return (
      <div className="space-y-6 p-4 sm:p-8">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Role Management</p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Roles & Permissions
          </h1>
        </header>
        <div className="rounded-2xl border border-warning-200 bg-warning-50 p-6 text-center dark:border-warning-800 dark:bg-warning-900/20">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/30">
            <svg
              className="h-6 w-6 text-warning-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="font-semibold text-gray-900 dark:text-white/90">Access Restricted</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You do not have permission to manage roles. Contact your administrator for access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Role Management</p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Roles & Permissions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage user roles and their associated permissions
          </p>
        </div>
        <ProtectedContent permission="company:edit_settings">
          <Link href="/roles/create">
            <Button size="sm">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8 2C8.41421 2 8.75 2.33579 8.75 2.75V7.25H13.25C13.6642 7.25 14 7.58579 14 8C14 8.41421 13.6642 8.75 13.25 8.75H8.75V13.25C8.75 13.6642 8.41421 14 8 14C7.58579 14 7.25 13.6642 7.25 13.25V8.75H2.75C2.33579 8.75 2 8.41421 2 8C2 7.58579 2.33579 7.25 2.75 7.25H7.25V2.75C7.25 2.33579 7.58579 2 8 2Z"
                  fill="currentColor"
                />
              </svg>
              Create Custom Role
            </Button>
          </Link>
        </ProtectedContent>
      </header>

      {alert && (
        <div role="status" aria-live="assertive">
          <Alert variant={alert.variant} title={alert.title} message={alert.message} />
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading roles...</p>
        </div>
      ) : roles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-8 text-center dark:border-gray-700 dark:bg-gray-900/60">
          <p className="text-sm text-gray-600 dark:text-gray-400">No roles found.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {role.name}
                  </h3>
                  {role.isSystemRole && (
                    <span className="mt-1 inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                      System Role
                    </span>
                  )}
                </div>
              </div>

              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {role.description || "No description provided"}
              </p>

              <div className="mb-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="text-gray-400"
                  >
                    <path
                      d="M8 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM8 9.5c-2.33 0-7 1.17-7 3.5V14h14v-1c0-2.33-4.67-3.5-7-3.5z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>{role.userCount}</strong> users
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="text-gray-400"
                  >
                    <path
                      d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 12.6A5.6 5.6 0 1113.6 8 5.6 5.6 0 018 13.6zm.5-9.1v4.3l3.5 2.1-.5.9-4-2.4V4.5h1z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>{role.permissions.length}</strong> permissions
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/roles/${role.id}`} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
                {!role.isSystemRole && (
                  <ProtectedContent permission="company:edit_settings">
                    <Link href={`/roles/${role.id}/edit`}>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </Link>
                    <button
                      onClick={() => handleDelete(role.id, role.name)}
                      className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </ProtectedContent>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
