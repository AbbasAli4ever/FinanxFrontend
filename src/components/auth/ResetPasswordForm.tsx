"use client";

import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { validateResetToken, resetPassword } from "@/services/authService";
import { formatApiErrorMessage } from "@/utils/apiError";
import { isNetworkError, getNetworkErrorMessage } from "@/services/apiClient";

type AlertState = { variant: "success" | "error" | "warning"; title: string; message: string };
type TokenStatus = "loading" | "valid" | "invalid";
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const LogoBadge = () => (
  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-lg shadow-brand-200/50 dark:bg-gray-800 dark:shadow-brand-950/30 mb-5">
    <Image src="/images/logo/f-logo.png" alt="FinanX" width={36} height={36} />
  </div>
);

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center min-h-screen px-4 py-12">
    <div className="w-full max-w-[400px]">
      <div className="flex flex-col items-center mb-10">
        <LogoBadge />
      </div>
      {children}
      <p className="mt-6 text-center text-[11px] text-gray-400 dark:text-gray-600">
        FinanX — Professional Financial Management
      </p>
    </div>
  </div>
);

const CardWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-xl p-7 sm:p-8 shadow-xl shadow-gray-200/40 dark:border-gray-800/70 dark:bg-gray-900/80 dark:shadow-black/20">
    {children}
  </div>
);

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

  useEffect(() => {
    const validate = async () => {
      if (!token) { setTokenStatus("invalid"); return; }
      try {
        const res = await validateResetToken(token);
        if (res.data?.valid) { setTokenStatus("valid"); setMaskedEmail(res.data.email || ""); }
        else { setTokenStatus("invalid"); }
      } catch { setTokenStatus("invalid"); }
    };
    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAlert(null);
    if (!newPassword.trim()) { setAlert({ variant: "error", title: "Password required", message: "Please enter a new password." }); return; }
    if (!PASSWORD_REGEX.test(newPassword)) { setAlert({ variant: "error", title: "Password requirements not met", message: "Min 8 chars with uppercase, lowercase, number, and special character (@$!%*?&)." }); return; }
    if (newPassword !== confirmPassword) { setAlert({ variant: "error", title: "Passwords don't match", message: "Please make sure both passwords match." }); return; }
    setIsSubmitting(true);
    try {
      const res = await resetPassword(token, newPassword);
      if (res.success) { setSuccess(true); setTimeout(() => router.push("/signin"), 3000); }
      else { setAlert({ variant: "error", title: "Unable to reset password", message: res.message || "Failed to reset password. Please try again." }); }
    } catch (error) {
      if (isNetworkError(error)) { setAlert({ variant: "error", title: "Connection Error", message: getNetworkErrorMessage() }); }
      else { setAlert({ variant: "error", title: "Unable to reset password", message: formatApiErrorMessage(error) }); }
    } finally { setIsSubmitting(false); }
  };

  // Loading state
  if (tokenStatus === "loading") {
    return (
      <PageShell>
        <CardWrapper>
          <div className="flex flex-col items-center py-6">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
            <p className="text-[13px] text-gray-500 dark:text-gray-400">Validating your reset link...</p>
          </div>
        </CardWrapper>
      </PageShell>
    );
  }

  // Invalid / expired token
  if (tokenStatus === "invalid") {
    return (
      <PageShell>
        <CardWrapper>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-100 dark:bg-error-500/20 mb-4">
              <svg className="h-5 w-5 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Invalid or expired link</h2>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-1.5">This password reset link is invalid or has expired.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">Reset links expire after 1 hour for security.</p>
            <Link href="/forgot-password" className="w-full">
              <Button variant="primary" size="md" className="w-full">Request new reset link</Button>
            </Link>
          </div>
        </CardWrapper>
      </PageShell>
    );
  }

  // Success state
  if (success) {
    return (
      <PageShell>
        <CardWrapper>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20 mb-4">
              <svg className="h-5 w-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Password reset successful</h2>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-1.5">Your password has been changed successfully.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">Redirecting to sign in...</p>
            <Link href="/signin" className="w-full">
              <Button variant="primary" size="md" className="w-full">Go to sign in</Button>
            </Link>
          </div>
        </CardWrapper>
      </PageShell>
    );
  }

  // Reset form
  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <LogoBadge />
          <h1 className="text-[26px] font-bold text-gray-900 dark:text-white tracking-tight">
            Reset your password
          </h1>
          <p className="mt-2 text-[14px] text-gray-500 dark:text-gray-400">
            Resetting for <strong className="text-gray-700 dark:text-gray-300">{maskedEmail}</strong>
          </p>
        </div>

        {/* Card */}
        <CardWrapper>
          {alert && (
            <div className="mb-5" role="status" aria-live="polite">
              <Alert variant={alert.variant} title={alert.title} message={alert.message} />
            </div>
          )}
          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>New Password <span className="text-error-500">*</span></Label>
              <div className="relative">
                <Input placeholder="Enter new password" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" disabled={isSubmitting} />
                <span onClick={() => setShowPassword(!showPassword)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-3 top-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showPassword ? <EyeIcon className="fill-current" /> : <EyeCloseIcon className="fill-current" />}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">Min 8 chars with uppercase, lowercase, number & special character</p>
            </div>
            <div>
              <Label>Confirm Password <span className="text-error-500">*</span></Label>
              <div className="relative">
                <Input placeholder="Confirm new password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" disabled={isSubmitting} />
                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-3 top-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showConfirmPassword ? <EyeIcon className="fill-current" /> : <EyeCloseIcon className="fill-current" />}
                </span>
              </div>
            </div>
            <Button type="submit" className="w-full" size="md" disabled={isSubmitting}>
              {isSubmitting ? "Resetting password..." : "Reset password"}
            </Button>
          </form>
        </CardWrapper>

        <p className="mt-6 text-center text-[11px] text-gray-400 dark:text-gray-600">
          FinanX — Professional Financial Management
        </p>
      </div>
    </div>
  );
}
