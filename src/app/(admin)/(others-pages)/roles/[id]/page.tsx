"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function RoleDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params?.id as string;
  const { token, isAuthenticated, isReady } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const hasAccess = Boolean(token && isAuthenticated);
  const canManageRoles = hasPermission("company:edit_settings");

  const loadRole = useCallback(async () => {
    if (!token || !roleId || !canManageRoles) return;

    setLoading(true);
    try {
      const data = await rolesService.getRole(roleId, token);
      setRole(data);
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
          title: "Unable to load role",
          message: formatApiErrorMessage(error),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token, roleId, canManageRoles]);

  useEffect(() => {
    if (!hasAccess || permissionsLoading) return;
    if (canManageRoles) {
      loadRole();
    } else {
      setLoading(false);
    }
  }, [hasAccess, permissionsLoading, canManageRoles, loadRole]);

  const handleDelete = useCallback(async () => {
    if (!token || !role || !canManageRoles) return;
    if (!window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      return;
    }

    try {
      await rolesService.deleteRole(role.id, token);
      setAlert({
        variant: "success",
        title: "Role deleted",
        message: `The role "${role.name}" has been deleted successfully.`,
      });
      setTimeout(() => {
        router.push("/roles");
      }, 1500);
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
  }, [token, role, canManageRoles, router]);

  if (!isReady || permissionsLoading || loading) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/60">
        <div className="flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span>{!isReady ? "Checking authentication..." : "Loading role details..."}</span>
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
      </div>
    );
  }

  if (!canManageRoles) {
    return (
      <div className="space-y-6 p-4 sm:p-8">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Role Details</p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">View Role</h1>
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
            You do not have permission to view role details. Contact your administrator for access.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="space-y-6 p-4 sm:p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">Role not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/roles")}>
            Back to Roles
          </Button>
        </div>
      </div>
    );
  }

  // Group permissions by module
  const permissionsByModule: Record<string, typeof role.permissions> = {};
  role.permissions.forEach((perm) => {
    const moduleCode = perm.module.code;
    if (!permissionsByModule[moduleCode]) {
      permissionsByModule[moduleCode] = [];
    }
    permissionsByModule[moduleCode].push(perm);
  });

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <header className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Role Details</p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{role.name}</h1>
          {role.isSystemRole && (
            <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
              System Role
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!role.isSystemRole && (
            <ProtectedContent permission="company:edit_settings">
              <Link href={`/roles/${role.id}/edit`}>
                <Button size="sm" variant="outline">
                  Edit Role
                </Button>
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Delete Role
              </button>
            </ProtectedContent>
          )}
        </div>
      </header>

      {alert && (
        <div role="status" aria-live="assertive">
          <Alert variant={alert.variant} title={alert.title} message={alert.message} />
        </div>
      )}

      {/* Role Information */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/3">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Role Information
        </h2>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {role.description || "No description provided"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Users Assigned</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{role.userCount}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Permissions</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{role.permissions.length}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {new Date(role.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      {/* Permissions */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/3">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Permissions ({role.permissions.length})
        </h2>

        <div className="space-y-6">
          {Object.entries(permissionsByModule)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([moduleCode, perms]) => {
              const moduleName = perms[0]?.module.name || moduleCode.charAt(0).toUpperCase() + moduleCode.slice(1).replace(/_/g, ' ');

              return (
                <div key={moduleCode} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
                    {moduleName}{" "}
                    <span className="text-sm font-normal text-gray-500">({perms.length})</span>
                  </h3>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {perms.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 dark:bg-white/2"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          className="mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400"
                          fill="none"
                        >
                          <path
                            d="M13.5 4.5L6 12L2.5 8.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {permission.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {permission.description || permission.code}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Back Button */}
      <div>
        <Button variant="outline" onClick={() => router.push("/roles")}>
          Back to Roles
        </Button>
      </div>
    </div>
  );
}
