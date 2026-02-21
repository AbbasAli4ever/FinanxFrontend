"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usersService } from "@/services/usersService";
import { formatApiErrorMessage } from "@/utils/apiError";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import type { UpdateUserRequest, UserDetails } from "@/types/users";

type AlertState = {
  variant: "success" | "error";
  title: string;
  message: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfilePage() {
  const { user, token, isAuthenticated, isReady } = useAuth();
  const [fullUserData, setFullUserData] = useState<UserDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const loadUserDetails = async () => {
      if (user?.id && token) {
        try {
          const details = await usersService.getUser(user.id, token);
          setFullUserData(details);
          setProfileForm({
            firstName: details.firstName || "",
            lastName: details.lastName || "",
            email: details.email || "",
            phone: details.phone || "",
          });
        } catch (error) {
          console.error("Failed to load user details:", error);
        }
      }
    };

    loadUserDetails();
  }, [user, token]);

  const handleProfileChange = (field: keyof typeof profileForm) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAlert(null);
    setProfileForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handlePasswordChange = (field: keyof typeof passwordForm) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAlert(null);
    setPasswordForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleUpdateProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setAlert(null);

    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      setAlert({
        variant: "error",
        title: "Name required",
        message: "Please provide your full name.",
      });
      return;
    }

    if (!profileForm.email.trim()) {
      setAlert({
        variant: "error",
        title: "Email required",
        message: "Please provide an email address.",
      });
      return;
    }

    if (!emailRegex.test(profileForm.email.trim())) {
      setAlert({
        variant: "error",
        title: "Invalid email",
        message: "Please enter a valid email address.",
      });
      return;
    }

    if (!user?.id || !token) return;

    setLoading(true);
    try {
      const updateData: UpdateUserRequest = {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim() || undefined,
      };

      await usersService.updateUser(user.id, updateData, token);

      setAlert({
        variant: "success",
        title: "Profile updated",
        message: "Your profile has been updated successfully.",
      });
      setIsEditing(false);

      // Refresh user data
      window.location.reload();
    } catch (error) {
      setAlert({
        variant: "error",
        title: "Update failed",
        message: formatApiErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setAlert(null);

    if (!passwordForm.currentPassword) {
      setAlert({
        variant: "error",
        title: "Current password required",
        message: "Please enter your current password.",
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setAlert({
        variant: "error",
        title: "Password too short",
        message: "New password must be at least 8 characters long.",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAlert({
        variant: "error",
        title: "Passwords don't match",
        message: "Please make sure both passwords match.",
      });
      return;
    }

    if (!token) return;

    setLoading(true);
    try {
      await usersService.changePassword(
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        token
      );

      setAlert({
        variant: "success",
        title: "Password changed",
        message: "Your password has been changed successfully.",
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsChangingPassword(false);
    } catch (error) {
      setAlert({
        variant: "error",
        title: "Password change failed",
        message: formatApiErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 dark:text-gray-400">
          Please sign in to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90 sm:text-title-lg">
          Profile Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account information and password
        </p>
      </div>

      {alert && (
        <div className="mb-6">
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
          />
        </div>
      )}

      {/* Profile Information Card */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Profile Information
          </h2>
          {!isEditing && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </div>

        {!isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1">First Name</Label>
                <p className="text-gray-700 dark:text-gray-300">{user.firstName}</p>
              </div>
              <div>
                <Label className="mb-1">Last Name</Label>
                <p className="text-gray-700 dark:text-gray-300">{user.lastName}</p>
              </div>
            </div>
            <div>
              <Label className="mb-1">Email</Label>
              <p className="text-gray-700 dark:text-gray-300">{user.email}</p>
            </div>
            <div>
              <Label className="mb-1">Phone</Label>
              <p className="text-gray-700 dark:text-gray-300">
                {fullUserData?.phone || "Not provided"}
              </p>
            </div>
            <div>
              <Label className="mb-1">Role</Label>
              <p className="text-gray-700 dark:text-gray-300">
                {user.role?.name || "No role assigned"}
                {user.isPrimaryAdmin && (
                  <span className="ml-2 text-sm text-brand-500 dark:text-brand-400">
                    (Primary Admin)
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>
                    First Name<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={profileForm.firstName}
                    onChange={handleProfileChange("firstName")}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label>
                    Last Name<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={profileForm.lastName}
                    onChange={handleProfileChange("lastName")}
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <Label>
                  Email<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileChange("email")}
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Phone (optional)</Label>
                <Input
                  type="tel"
                  value={profileForm.phone}
                  onChange={handleProfileChange("phone")}
                  placeholder="+1234567890"
                  disabled={loading}
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setProfileForm({
                      firstName: user.firstName || "",
                      lastName: user.lastName || "",
                      email: user.email || "",
                      phone: fullUserData?.phone || "",
                    });
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Change Password Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Change Password
          </h2>
          {!isChangingPassword && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsChangingPassword(true)}
            >
              Change Password
            </Button>
          )}
        </div>

        {!isChangingPassword ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click "Change Password" to update your password
          </p>
        ) : (
          <form onSubmit={handleChangePassword}>
            <div className="space-y-5">
              <div>
                <Label>
                  Current Password<span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange("currentPassword")}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <span
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                  >
                    {showCurrentPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>
              <div>
                <Label>
                  New Password<span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange("newPassword")}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <span
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                  >
                    {showNewPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>
              <div>
                <Label>
                  Confirm New Password<span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange("confirmPassword")}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? "Changing..." : "Change Password"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordForm({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
