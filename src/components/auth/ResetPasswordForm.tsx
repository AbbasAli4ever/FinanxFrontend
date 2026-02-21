"use client";

import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { validateResetToken, resetPassword } from "@/services/authService";
import { formatApiErrorMessage } from "@/utils/apiError";
import { isNetworkError, getNetworkErrorMessage } from "@/services/apiClient";

type AlertState = {
  variant: "success" | "error" | "warning";
  title: string;
  message: string;
};

type TokenStatus = "loading" | "valid" | "invalid";

// Password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("loading");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenStatus("invalid");
        return;
      }

      try {
        const response = await validateResetToken(token);
        if (response.data?.valid) {
          setTokenStatus("valid");
          setMaskedEmail(response.data.email || "");
        } else {
          setTokenStatus("invalid");
        }
      } catch (error) {
        console.error("Token validation error:", error);
        setTokenStatus("invalid");
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAlert(null);

    if (!newPassword.trim()) {
      setAlert({
        variant: "error",
        title: "Password required",
        message: "Please enter a new password.",
      });
      return;
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      setAlert({
        variant: "error",
        title: "Password requirements not met",
        message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&).",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setAlert({
        variant: "error",
        title: "Passwords don't match",
        message: "Please make sure both passwords match.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPassword(token, newPassword);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/signin");
        }, 3000);
      } else {
        setAlert({
          variant: "error",
          title: "Unable to reset password",
          message: response.message || "Failed to reset password. Please try again.",
        });
      }
    } catch (error) {
      console.error("Reset password error:", error);

      // Check if it's a network error
      if (isNetworkError(error)) {
        setAlert({
          variant: "error",
          title: "Connection Error",
          message: getNetworkErrorMessage(),
        });
      } else {
        setAlert({
          variant: "error",
          title: "Unable to reset password",
          message: formatApiErrorMessage(error),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (tokenStatus === "loading") {
    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Validating your reset link...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (tokenStatus === "invalid") {
    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
        <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
          <Link
            href="/signin"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon />
            Back to sign in
          </Link>
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="rounded-2xl border border-error-200 bg-error-50 p-6 dark:border-error-500/30 dark:bg-error-500/15">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-100 dark:bg-error-500/20">
                <svg
                  className="h-5 w-5 text-error-600 dark:text-error-400"
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
              <h2 className="text-lg font-semibold text-error-900 dark:text-error-100">
                Invalid or Expired Link
              </h2>
            </div>
            <p className="mb-4 text-sm text-error-700 dark:text-error-200">
              This password reset link is invalid or has expired.
            </p>
            <p className="mb-6 text-sm text-error-600 dark:text-error-300">
              Reset links expire after 1 hour for security reasons.
            </p>
            <Link href="/forgot-password">
              <Button variant="primary" size="sm" className="w-full">
                Request New Reset Link
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
        <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
          <Link
            href="/signin"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon />
            Back to sign in
          </Link>
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="rounded-2xl border border-success-200 bg-success-50 p-6 dark:border-success-500/30 dark:bg-success-500/15">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20">
                <svg
                  className="h-5 w-5 text-success-600 dark:text-success-400"
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
              </div>
              <h2 className="text-lg font-semibold text-success-900 dark:text-success-100">
                Password Reset Successful!
              </h2>
            </div>
            <p className="mb-4 text-sm text-success-700 dark:text-success-200">
              Your password has been changed successfully.
            </p>
            <p className="mb-6 text-sm text-success-600 dark:text-success-300">
              You can now log in with your new password. Redirecting...
            </p>
            <Link href="/signin">
              <Button variant="primary" size="sm" className="w-full">
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to sign in
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Reset Your Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Resetting password for: <strong>{maskedEmail}</strong>
            </p>
          </div>
          {alert && (
            <div className="mb-6" role="status" aria-live="polite">
              <Alert
                variant={alert.variant}
                title={alert.title}
                message={alert.message}
              />
            </div>
          )}
          <form noValidate onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <Label>
                  New Password<span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Enter new password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Must be 8+ characters with uppercase, lowercase, number, and special character (@$!%*?&)
                </p>
              </div>
              <div>
                <Label>
                  Confirm Password<span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Confirm new password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                  <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>
              <div>
                <Button
                  type="submit"
                  className="w-full"
                  size="sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Resetting Password..." : "Reset Password"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
