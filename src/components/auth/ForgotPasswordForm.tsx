"use client";

import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Link from "next/link";
import Image from "next/image";
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
      <div className="flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-[400px]">
          <div className="flex flex-col items-center mb-10">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-lg shadow-brand-200/50 dark:bg-gray-800 dark:shadow-brand-950/30 mb-5">
              <Image src="/images/logo/f-logo.png" alt="FinanX" width={36} height={36} />
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-xl p-7 sm:p-8 shadow-xl shadow-gray-200/40 dark:border-gray-800/70 dark:bg-gray-900/80 dark:shadow-black/20">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20 mb-4">
                <svg className="h-5 w-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Check your email</h2>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-1">
                If an account exists with <strong className="text-gray-700 dark:text-gray-300">{email}</strong>, you will receive a password reset link.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">The link expires in 1 hour.</p>
              <Link href="/signin" className="w-full">
                <Button variant="outline" size="md" className="w-full">Back to sign in</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-lg shadow-brand-200/50 dark:bg-gray-800 dark:shadow-brand-950/30 mb-5">
            <Image src="/images/logo/f-logo.png" alt="FinanX" width={36} height={36} />
          </div>
          <h1 className="text-[26px] font-bold text-gray-900 dark:text-white tracking-tight">
            Forgot password?
          </h1>
          <p className="mt-2 text-[14px] text-gray-500 dark:text-gray-400">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-xl p-7 sm:p-8 shadow-xl shadow-gray-200/40 dark:border-gray-800/70 dark:bg-gray-900/80 dark:shadow-black/20">
          {alert && (
            <div className="mb-5" role="status" aria-live="polite">
              <Alert variant={alert.variant} title={alert.title} message={alert.message} />
            </div>
          )}
          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Email Address <span className="text-error-500">*</span></Label>
              <Input placeholder="you@company.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" disabled={isSubmitting} />
            </div>
            <Button type="submit" className="w-full" size="md" disabled={isSubmitting}>
              {isSubmitting ? "Sending reset link..." : "Send reset link"}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-[13px] text-center text-gray-500 dark:text-gray-400">
          Remember your password?{" "}
          <Link href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium transition-colors">Sign in</Link>
        </p>

        <p className="mt-5 text-center text-[11px] text-gray-400 dark:text-gray-600">
          FinanX — Professional Financial Management
        </p>
      </div>
    </div>
  );
}
