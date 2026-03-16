"use client";

import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { forgotPassword } from "@/services/authService";
import { formatApiErrorMessage } from "@/utils/apiError";
import { isNetworkError, getNetworkErrorMessage } from "@/services/apiClient";

type AlertState = { variant: "success" | "error"; title: string; message: string };
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAlert(null);
    const normalizedEmail = email.trim();
    if (!normalizedEmail) { setAlert({ variant: "error", title: "Email required", message: "Please enter your email address." }); return; }
    if (!emailRegex.test(normalizedEmail)) { setAlert({ variant: "error", title: "Invalid email", message: "Please enter a valid email address." }); return; }
    setIsSubmitting(true);
    try {
      const response = await forgotPassword(normalizedEmail);
      if (response.success) { setSubmitted(true); }
      else { setAlert({ variant: "error", title: "Unable to send reset link", message: response.message || "Failed to send password reset email. Please try again." }); }
    } catch (error) {
      if (isNetworkError(error)) { setAlert({ variant: "error", title: "Connection Error", message: getNetworkErrorMessage() }); }
      else { setAlert({ variant: "error", title: "Unable to send reset link", message: formatApiErrorMessage(error) }); }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col flex-1 w-full overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <Link href="/signin" className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
            <ChevronLeftIcon />Back to sign in
          </Link>
          <span className="text-[12px] text-gray-400 dark:text-gray-600">FinanX</span>
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-[400px] mx-auto px-6 py-10">
          <div className="rounded-lg border border-success-200 bg-success-50 p-6 dark:border-success-500/30 dark:bg-success-500/10">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-success-100 dark:bg-success-500/20 flex-shrink-0">
                <svg className="h-4 w-4 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-[15px] font-semibold text-success-900 dark:text-success-100">Check your email</h2>
            </div>
            <p className="mb-2 text-[13px] text-success-700 dark:text-success-200">
              If an account exists with <strong>{email}</strong>, you will receive a password reset link.
            </p>
            <p className="text-[12px] text-success-600 dark:text-success-300 mb-5">The link expires in 1 hour.</p>
            <Link href="/signin">
              <Button variant="outline" size="md" className="w-full">Back to sign in</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <Link href="/signin" className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
          <ChevronLeftIcon />Back to sign in
        </Link>
        <span className="text-[12px] text-gray-400 dark:text-gray-600">FinanX</span>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-[400px] mx-auto px-6 py-10">
        <div className="mb-7">
          <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white mb-1.5">Forgot password?</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">Enter your email and we&apos;ll send a reset link.</p>
        </div>
        {alert && (
          <div className="mb-5" role="status" aria-live="polite">
            <Alert variant={alert.variant} title={alert.title} message={alert.message} />
          </div>
        )}
        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Email Address <span className="text-error-500">*</span></Label>
            <Input placeholder="you@company.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" disabled={isSubmitting} />
          </div>
          <Button type="submit" className="w-full" size="md" disabled={isSubmitting}>
            {isSubmitting ? "Sending reset link…" : "Send reset link"}
          </Button>
        </form>
        <p className="mt-5 text-[13px] text-center text-gray-500 dark:text-gray-400">
          Remember your password?{" "}
          <Link href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
