"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import rolesService, { CreateRoleRequest, Permission } from "@/services/rolesService";
import permissionsService from "@/services/permissionsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import { isPermissionDeniedError, getPermissionDeniedMessage } from "@/services/apiClient";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";

type AlertState = {
  variant: "success" | "error" | "warning";
  title: string;
  message: string;
};

export default function CreateRolePage() {
  const router = useRouter();
  const { token, isAuthenticated, isReady } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
  });

  const [permissions, setPermissions] = useState<{
    all: Permission[];
    byModule: Record<string, Permission[]>;
  } | null>(null);

  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const hasAccess = Boolean(token && isAuthenticated);
  const canManageRoles = hasPermission("company:edit_settings");

  // Load permissions on mount
  useEffect(() => {
    if (!hasAccess || permissionsLoading) return;
    if (!canManageRoles) {
      setLoadingPermissions(false);
      return;
    }

    const loadPermissions = async () => {
      if (!token) return;

      setLoadingPermissions(true);
      try {
        const perms = await permissionsService.getAllPermissions(token);
        setPermissions(perms);
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
            title: "Unable to load permissions",
            message: formatApiErrorMessage(error),
          });
        }
      } finally {
        setLoadingPermissions(false);
      }
    };

    loadPermissions();
  }, [hasAccess, permissionsLoading, canManageRoles, token]);

  const handlePermissionToggle = useCallback((permissionId: string) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAllInModule = useCallback(
    (moduleCode: string) => {
      if (!permissions) return;

      const modulePerms = permissions.byModule[moduleCode] || [];
      const allSelected = modulePerms.every((p) => selectedPermissions.has(p.id));

      setSelectedPermissions((prev) => {
        const newSet = new Set(prev);
        if (allSelected) {
          modulePerms.forEach((p) => newSet.delete(p.id));
        } else {
          modulePerms.forEach((p) => newSet.add(p.id));
        }
        return newSet;
      });
    },
    [permissions, selectedPermissions]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !canManageRoles) return;

    if (!formData.code.trim()) {
      setAlert({
        variant: "error",
        title: "Validation error",
        message: "Role code is required",
      });
      return;
    }

    if (!formData.name.trim()) {
      setAlert({
        variant: "error",
        title: "Validation error",
        message: "Role name is required",
      });
      return;
    }

    if (selectedPermissions.size === 0) {
      setAlert({
        variant: "error",
        title: "Validation error",
        message: "Please select at least one permission",
      });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const payload: CreateRoleRequest = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        permissionIds: Array.from(selectedPermissions),
      };

      await rolesService.createRole(payload, token);

      setAlert({
        variant: "success",
        title: "Role created",
        message: `The role "${formData.name}" has been created successfully.`,
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
          title: "Unable to create role",
          message: formatApiErrorMessage(error),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isReady || permissionsLoading || loadingPermissions) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/60">
        <div className="flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span>{!isReady ? "Checking authentication..." : "Loading permissions..."}</span>
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
          Sign in to create custom roles.
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
            Create Custom Role
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
            You do not have permission to create roles. Contact your administrator for access.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/roles")}>
            Back to Roles
          </Button>
        </div>
      </div>
    );
  }

  if (!permissions) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm text-red-700 dark:text-red-400">
          Failed to load permissions. Please refresh the page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Role Management</p>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Create Custom Role
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Define a new role with specific permissions
        </p>
      </header>

      {alert && (
        <div role="status" aria-live="assertive">
          <Alert variant={alert.variant} title={alert.title} message={alert.message} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/3">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Role Code <span className="text-red-500">*</span>
              </label>
              <Input
                id="code"
                type="text"
                placeholder="e.g., sales_manager"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                A unique identifier for this role (3-50 characters, lowercase with underscores)
              </p>
            </div>

            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Role Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Sales Manager"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this role can do..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-700 shadow-theme-xs outline-none transition focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Permissions ({selectedPermissions.size} / {permissions.all.length} selected)
            </h2>
          </div>

          <div className="space-y-6">
            {Object.entries(permissions.byModule)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([moduleCode, perms]) => {
                const allSelected = perms.every((p) => selectedPermissions.has(p.id));
                const moduleName = perms[0]?.module.name || moduleCode;

                return (
                  <div
                    key={moduleCode}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {moduleName}{" "}
                        <span className="text-sm font-normal text-gray-500">
                          ({perms.length})
                        </span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleSelectAllInModule(moduleCode)}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                      >
                        {allSelected ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {perms.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex cursor-pointer items-start gap-3 rounded-lg p-3 transition hover:bg-gray-50 dark:hover:bg-white/2"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.has(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-2 focus:ring-brand-500 focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-800"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {permission.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {permission.description || permission.code}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/roles")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating Role..." : "Create Role"}
          </Button>
        </div>
      </form>
    </div>
  );
}
