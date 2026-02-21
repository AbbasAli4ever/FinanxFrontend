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

type AlertState = {
  variant: "success" | "error";
  title: string;
  message: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAlert(null);

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setAlert({
        variant: "error",
        title: "Email required",
        message: "Please enter your email address.",
      });
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      setAlert({
        variant: "error",
        title: "Invalid email",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await forgotPassword(normalizedEmail);

      // Check if the response indicates success
      if (response.success) {
        setSubmitted(true);
      } else {
        setAlert({
          variant: "error",
          title: "Unable to send reset link",
          message: response.message || "Failed to send password reset email. Please try again.",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);

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
          title: "Unable to send reset link",
          message: formatApiErrorMessage(error),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-success-900 dark:text-success-100">
                Check Your Email
              </h2>
            </div>
            <p className="mb-4 text-sm text-success-700 dark:text-success-200">
              If an account exists with <strong>{email}</strong>, you will receive a password reset link.
            </p>
            <p className="text-sm text-success-600 dark:text-success-300">
              The link expires in 1 hour.
            </p>
            <div className="mt-6">
              <Link href="/signin">
                <Button variant="outline" size="sm" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              Forgot Password?
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email address and we&apos;ll send you a link to reset your password.
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
                  Email Address<span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Button
                  type="submit"
                  className="w-full"
                  size="sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending Reset Link..." : "Send Reset Link"}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Remember your password?
              <Link
                href="/signin"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                {" "}
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
