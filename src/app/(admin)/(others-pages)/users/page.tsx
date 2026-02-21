"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import ProtectedContent from "@/components/auth/ProtectedContent";
import { usersService } from "@/services/usersService";
import { formatApiErrorMessage } from "@/utils/apiError";
import { isPermissionDeniedError, getPermissionDeniedMessage, API_BASE_URL } from "@/services/apiClient";
import type { Invitation, User } from "@/types/users";

type AlertState = {
  variant: "success" | "error" | "warning";
  title: string;
  message: string;
};

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
}

const initialInviteForm = {
  email: "",
  firstName: "",
  lastName: "",
  roleId: "",
  message: "",
};

type InviteFormState = typeof initialInviteForm;

export default function UserManagementPage() {
  const { token, isAuthenticated, isReady } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [formState, setFormState] = useState<InviteFormState>({
    ...initialInviteForm,
  });
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [manualInvitationLink, setManualInvitationLink] = useState<string | null>(null);
  const [showManualLinkDialog, setShowManualLinkDialog] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const hasAccess = Boolean(token && isAuthenticated);
  const canViewUsers = hasPermission("user:view");
  const canInviteUsers = hasPermission("user:invite");
  const canEditUsers = hasPermission("user:edit");
  const canDeleteUsers = hasPermission("user:delete");

  const loadUsers = useCallback(async () => {
    if (!token || !canViewUsers) return;

    setLoadingUsers(true);
    try {
      const data = await usersService.getAllUsers(token);
      setUsers(data);
    } catch (error) {
      console.error(error);
      if (isPermissionDeniedError(error)) {
        setAlert({
          variant: "warning",
          title: "Access Denied",
          message: getPermissionDeniedMessage(error),
        });
      } else {
        setAlert({
          variant: "error",
          title: "Unable to load users",
          message: formatApiErrorMessage(error),
        });
      }
    } finally {
      setLoadingUsers(false);
    }
  }, [token, canViewUsers]);

  const loadInvitations = useCallback(async () => {
    if (!token || !canViewUsers) return;

    setLoadingInvites(true);
    try {
      const data = await usersService.getPendingInvitations(token);
      setInvitations(data);
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        // User doesn't have permission to view invitations
        setInvitations([]);
      } else {
        console.error('Error loading invitations:', error);
        setInvitations([]);
      }
    } finally {
      setLoadingInvites(false);
    }
  }, [token, canViewUsers]);

  const loadRoles = useCallback(async () => {
    if (!token) return;

    setLoadingRoles(true);
    try {
      const response = await fetch(`${API_BASE_URL}/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          // User doesn't have permission to view roles
          setRoles([]);
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch roles:', response.status, errorData);
        throw new Error(`Failed to fetch roles: ${response.status}`);
      }

      const result = await response.json();
      setRoles(result.data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoadingRoles(false);
    }
  }, [token]);

  useEffect(() => {
    if (!hasAccess || permissionsLoading) {
      return;
    }

    if (canViewUsers) {
      loadUsers();
      loadInvitations();
    }
    if (canInviteUsers) {
      loadRoles();
    }
  }, [hasAccess, permissionsLoading, canViewUsers, canInviteUsers, loadUsers, loadInvitations, loadRoles]);

  const handleInviteChange =
    (field: keyof InviteFormState) =>
    (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      setAlert(null);
      setFormState((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleInviteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !canInviteUsers) return;

    if (
      !formState.email.trim() ||
      !formState.firstName.trim() ||
      !formState.lastName.trim() ||
      !formState.roleId
    ) {
      setAlert({
        variant: "error",
        title: "Incomplete information",
        message: "Fill in every required field before sending the invitation.",
      });
      return;
    }

    setIsSubmittingInvite(true);
    try {
      const response = await usersService.inviteUser(
        {
          email: formState.email.trim(),
          firstName: formState.firstName.trim(),
          lastName: formState.lastName.trim(),
          roleId: formState.roleId,
          message: formState.message.trim() || undefined,
        },
        token
      );

      // Check if email was sent successfully
      if (response.emailSent) {
        setAlert({
          variant: "success",
          title: "Invitation sent",
          message:
            "Your invitation has been queued. The recipient will receive an email soon.",
        });
      } else {
        // Email failed to send - show manual link
        const invitationLink = `${window.location.origin}/accept-invitation?token=${response.invitationToken}`;
        setManualInvitationLink(invitationLink);
        setShowManualLinkDialog(true);
        setAlert({
          variant: "warning",
          title: "Email delivery failed",
          message:
            "The invitation was created but the email could not be sent. Please copy the invitation link below and share it manually with the user.",
        });
      }

      setFormState({ ...initialInviteForm });
      loadInvitations();
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
          title: "Unable to invite",
          message: formatApiErrorMessage(error),
        });
      }
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleToggleActive = useCallback(
    async (user: User, action: "deactivate" | "reactivate") => {
      if (!token) return;

      // Check permissions
      if (action === "deactivate" && !canDeleteUsers) {
        setAlert({
          variant: "warning",
          title: "Access Denied",
          message: "You do not have permission to deactivate users.",
        });
        return;
      }
      if (action === "reactivate" && !canEditUsers) {
        setAlert({
          variant: "warning",
          title: "Access Denied",
          message: "You do not have permission to reactivate users.",
        });
        return;
      }

      if (user.isPrimaryAdmin && action === "deactivate") {
        setAlert({
          variant: "error",
          title: "Action not allowed",
          message: "Primary admin accounts cannot be deactivated.",
        });
        return;
      }

      try {
        if (action === "deactivate") {
          await usersService.deactivateUser(user.id, token);
          setAlert({
            variant: "success",
            title: "User deactivated",
            message: `${user.firstName} ${user.lastName} is now inactive.`,
          });
        } else {
          await usersService.reactivateUser(user.id, token);
          setAlert({
            variant: "success",
            title: "User reactivated",
            message: `${user.firstName} ${user.lastName} is now active again.`,
          });
        }
        loadUsers();
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
            title: "Unable to update",
            message: formatApiErrorMessage(error),
          });
        }
      }
    },
    [token, canDeleteUsers, canEditUsers, loadUsers]
  );

  const handleCopyInvitationLink = async () => {
    if (!manualInvitationLink) return;

    try {
      await navigator.clipboard.writeText(manualInvitationLink);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      setAlert({
        variant: "error",
        title: "Copy failed",
        message: "Unable to copy link to clipboard. Please copy it manually.",
      });
    }
  };

  const handleCloseManualLinkDialog = () => {
    setShowManualLinkDialog(false);
    setManualInvitationLink(null);
    setCopiedToClipboard(false);
  };

  const handleCancelInvitation = useCallback(
    async (invitationId: string) => {
      if (!token) return;

      if (!canDeleteUsers) {
        setAlert({
          variant: "warning",
          title: "Access Denied",
          message: "You do not have permission to cancel invitations.",
        });
        return;
      }

      if (!window.confirm("Cancel this invitation?")) return;

      try {
        await usersService.cancelInvitation(invitationId, token);
        setAlert({
          variant: "success",
          title: "Invitation cancelled",
          message: "The pending invitation was removed.",
        });
        loadInvitations();
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
            title: "Unable to cancel",
            message: formatApiErrorMessage(error),
          });
        }
      }
    },
    [token, canDeleteUsers, loadInvitations]
  );

  const userRows = useMemo(() => {
    if (!users.length) return null;

    return users.map((user) => (
      <tr key={user.id} className="border-b border-gray-200 dark:border-gray-800">
        <td className="px-2 py-3 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800 dark:text-white/90">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{user.email}</span>
          </div>
        </td>
        <td className="px-2 py-3 text-sm text-gray-600 dark:text-gray-300">
          {user.role?.name ?? "No role"}
        </td>
        <td className="px-2 py-3 text-sm">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
              user.isPrimaryAdmin
                ? "bg-brand-100 text-brand-600"
                : user.isActive
                ? "bg-success-100 text-success-600"
                : "bg-error-100 text-error-600"
            }`}
          >
            {user.isPrimaryAdmin ? "Primary Admin" : user.isActive ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400">
          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
        </td>
        <td className="px-2 py-3 text-sm space-x-2">
          {!user.isPrimaryAdmin && (
            <ProtectedContent
              anyOf={["user:delete", "user:edit"]}
              fallback={
                <span className="text-xs text-gray-400">No actions available</span>
              }
            >
              {user.isActive ? (
                <ProtectedContent permission="user:delete">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(user, "deactivate")}
                  >
                    Deactivate
                  </Button>
                </ProtectedContent>
              ) : (
                <ProtectedContent permission="user:edit">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleToggleActive(user, "reactivate")}
                  >
                    Reactivate
                  </Button>
                </ProtectedContent>
              )}
            </ProtectedContent>
          )}
        </td>
      </tr>
    ));
  }, [users, handleToggleActive]);

  const invitationRows = useMemo(() => {
    if (!invitations.length) return null;

    return invitations.map((invitation) => (
      <tr key={invitation.id} className="border-b border-gray-200 dark:border-gray-800">
        <td className="px-2 py-3 text-sm text-gray-700 dark:text-gray-300">
          {invitation.firstName} {invitation.lastName}
        </td>
        <td className="px-2 py-3 text-sm text-gray-600 dark:text-gray-400">
          {invitation.email}
        </td>
        <td className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400">
          {invitation.role.name}
        </td>
        <td className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400">
          {new Date(invitation.expiresAt).toLocaleDateString()}
        </td>
        <td className="px-2 py-3 text-sm">
          <ProtectedContent permission="user:delete">
            <Button size="sm" variant="outline" onClick={() => handleCancelInvitation(invitation.id)}>
              Cancel
            </Button>
          </ProtectedContent>
        </td>
      </tr>
    ));
  }, [invitations, handleCancelInvitation]);

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

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">User Management</p>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Team & Invitations</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Monitor user activity, invite new teammates, and keep invitations in check.
        </p>
      </header>

      {alert && (
        <div role="status" aria-live="assertive">
          <Alert variant={alert.variant} title={alert.title} message={alert.message} />
        </div>
      )}

      {showManualLinkDialog && manualInvitationLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl border border-warning-200 bg-white p-6 shadow-xl dark:border-warning-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/30">
                <svg
                  className="h-5 w-5 text-warning-500"
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">
                Manual Invitation Link
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
              The email could not be sent automatically. Please copy the invitation link below and share it manually with the user:
            </p>
            <div className="mb-4 rounded-lg border border-gray-300 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <code className="block break-all text-xs text-gray-700 dark:text-gray-300">
                {manualInvitationLink}
              </code>
            </div>
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={handleCopyInvitationLink}
              >
                {copiedToClipboard ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy Link
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleCloseManualLinkDialog}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {!hasAccess ? (
        <div className="rounded-2xl border border-gray-200 bg-white/70 p-6 text-center text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300">
          <p className="font-semibold text-gray-900 dark:text-white/90">Waiting for authentication...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to view company users and invitations.
          </p>
        </div>
      ) : !canViewUsers ? (
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
            You do not have permission to view users. Contact your administrator for access.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.9fr_1.1fr]">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Active Users</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {loadingUsers ? "Refreshing..." : ""}
                </p>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto custom-scrollbar">
              {loadingUsers ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No users found yet.</p>
              ) : (
                <table className="w-full table-fixed text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-[0.3em] text-gray-400">
                      <th className="px-2 py-2">Name</th>
                      <th className="px-2 py-2">Role</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Last login</th>
                      <th className="px-2 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>{userRows}</tbody>
                </table>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <ProtectedContent
              permission="user:invite"
              fallback={
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800/50">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You do not have permission to invite users.
                  </p>
                </div>
              }
            >
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">Invite teammate</h2>
              <form className="space-y-4" onSubmit={handleInviteSubmit}>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">First name</label>
                  <Input
                    type="text"
                    placeholder="Jane"
                    value={formState.firstName}
                    onChange={handleInviteChange("firstName")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last name</label>
                  <Input
                    type="text"
                    placeholder="Doe"
                    value={formState.lastName}
                    onChange={handleInviteChange("lastName")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <Input
                    type="email"
                    placeholder="jane@company.com"
                    value={formState.email}
                    onChange={handleInviteChange("email")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                  <select
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                    value={formState.roleId}
                    onChange={handleInviteChange("roleId")}
                    disabled={loadingRoles}
                  >
                    <option value="">
                      {loadingRoles ? "Loading roles..." : roles.length === 0 ? "No roles available" : "Choose a role"}
                    </option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Welcome message (optional)
                  </label>
                  <textarea
                    placeholder="Add a personal note"
                    value={formState.message}
                    onChange={handleInviteChange("message")}
                    className="min-h-[80px] w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-700 shadow-theme-xs outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  />
                </div>
                <div>
                  <Button type="submit" size="sm" className="w-full" disabled={isSubmittingInvite}>
                    {isSubmittingInvite ? "Sending invitation..." : "Send invitation"}
                  </Button>
                </div>
              </form>
            </ProtectedContent>

            <div className="mt-6 space-y-4">
              <div className="border-b border-dashed border-gray-200 pb-3 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Pending invitations</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tracking invites that are still waiting for acceptance.
                </p>
              </div>
              {loadingInvites ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading invitations...</p>
              ) : invitations.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No pending invitations.</p>
              ) : (
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-[0.3em] text-gray-400">
                        <th className="px-2 py-2">Name</th>
                        <th className="px-2 py-2">Email</th>
                        <th className="px-2 py-2">Role</th>
                        <th className="px-2 py-2">Expires</th>
                        <th className="px-2 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>{invitationRows}</tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
