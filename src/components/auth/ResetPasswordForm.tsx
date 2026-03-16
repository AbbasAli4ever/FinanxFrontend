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

type AlertState = { variant: "success" | "error" | "warning"; title: string; message: string };
type TokenStatus = "loading" | "valid" | "invalid";
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const TopNav = ({ back }: { back: string }) => (
  <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
    <Link href={back} className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
      <ChevronLeftIcon />Back to sign in
    </Link>
    <span className="text-[12px] text-gray-400 dark:text-gray-600">FinanX</span>
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

  if (tokenStatus === "loading") {
    return (
      <div className="flex flex-col flex-1 w-full">
        <TopNav back="/signin" />
        <div className="flex flex-col justify-center flex-1 w-full max-w-[400px] mx-auto px-6">
          <div className="text-center">
            <div className="mb-3 inline-block h-7 w-7 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
            <p className="text-[13px] text-gray-500 dark:text-gray-400">Validating your reset link…</p>
          </div>
        </div>
      </div>
    );
  }

  if (tokenStatus === "invalid") {
    return (
      <div className="flex flex-col flex-1 w-full overflow-y-auto no-scrollbar">
        <TopNav back="/signin" />
        <div className="flex flex-col justify-center flex-1 w-full max-w-[400px] mx-auto px-6 py-10">
          <div className="rounded-lg border border-error-200 bg-error-50 p-6 dark:border-error-500/30 dark:bg-error-500/10">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-error-100 dark:bg-error-500/20 flex-shrink-0">
                <svg className="h-4 w-4 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-[15px] font-semibold text-error-900 dark:text-error-100">Invalid or expired link</h2>
            </div>
            <p className="mb-1.5 text-[13px] text-error-700 dark:text-error-200">This password reset link is invalid or has expired.</p>
            <p className="mb-5 text-[12px] text-error-600 dark:text-error-300">Reset links expire after 1 hour for security reasons.</p>
            <Link href="/forgot-password">
              <Button variant="primary" size="md" className="w-full">Request new reset link</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col flex-1 w-full overflow-y-auto no-scrollbar">
        <TopNav back="/signin" />
        <div className="flex flex-col justify-center flex-1 w-full max-w-[400px] mx-auto px-6 py-10">
          <div className="rounded-lg border border-success-200 bg-success-50 p-6 dark:border-success-500/30 dark:bg-success-500/10">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-success-100 dark:bg-success-500/20 flex-shrink-0">
                <svg className="h-4 w-4 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-[15px] font-semibold text-success-900 dark:text-success-100">Password reset successful</h2>
            </div>
            <p className="mb-1.5 text-[13px] text-success-700 dark:text-success-200">Your password has been changed successfully.</p>
            <p className="mb-5 text-[12px] text-success-600 dark:text-success-300">Redirecting to sign in…</p>
            <Link href="/signin">
              <Button variant="primary" size="md" className="w-full">Go to sign in</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto no-scrollbar">
      <TopNav back="/signin" />
      <div className="flex flex-col justify-center flex-1 w-full max-w-[400px] mx-auto px-6 py-10">
        <div className="mb-7">
          <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white mb-1.5">Reset your password</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            Resetting password for: <strong className="text-gray-700 dark:text-gray-300">{maskedEmail}</strong>
          </p>
        </div>
        {alert && (
          <div className="mb-5" role="status" aria-live="polite">
            <Alert variant={alert.variant} title={alert.title} message={alert.message} />
          </div>
        )}
        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>New Password <span className="text-error-500">*</span></Label>
            <div className="relative">
              <Input placeholder="Enter new password" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" disabled={isSubmitting} />
              <span onClick={() => setShowPassword(!showPassword)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-3 top-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showPassword ? <EyeIcon className="fill-current" /> : <EyeCloseIcon className="fill-current" />}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">Min 8 chars with uppercase, lowercase, number & special character</p>
          </div>
          <div>
            <Label>Confirm Password <span className="text-error-500">*</span></Label>
            <div className="relative">
              <Input placeholder="Confirm new password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" disabled={isSubmitting} />
              <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-3 top-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showConfirmPassword ? <EyeIcon className="fill-current" /> : <EyeCloseIcon className="fill-current" />}
              </span>
            </div>
          </div>
          <Button type="submit" className="w-full" size="md" disabled={isSubmitting}>
            {isSubmitting ? "Resetting password…" : "Reset password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
