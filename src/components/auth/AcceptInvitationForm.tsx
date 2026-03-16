"use client";

import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { usersService } from "@/services/usersService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { ValidateInvitationData } from "@/types/users";

type AlertState = { variant: "success" | "error"; title: string; message: string };

export default function AcceptInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [invitation, setInvitation] = useState<ValidateInvitationData | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: validate invitation token on mount
  useEffect(() => {
    if (!token) {
      setAlert({ variant: "error", title: "Invalid invitation", message: "No invitation token found in URL. Please check your invitation link." });
      setIsValidating(false);
      return;
    }
    usersService.validateInvitation(token)
      .then((data) => {
        if (!data.valid) {
          setAlert({ variant: "error", title: "Invitation invalid", message: data.message || "This invitation is no longer valid." });
        } else {
          setInvitation(data);
        }
      })
      .catch(() => {
        setAlert({ variant: "error", title: "Could not validate", message: "Unable to verify your invitation. Please try again or request a new one." });
      })
      .finally(() => setIsValidating(false));
  }, [token]);

  // Step 2: accept invitation
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAlert(null);

    if (!invitation?.existingUser) {
      if (!password.trim()) { setAlert({ variant: "error", title: "Password required", message: "Please enter a password." }); return; }
      if (password.length < 8) { setAlert({ variant: "error", title: "Password too short", message: "Password must be at least 8 characters long." }); return; }
      if (password !== confirmPassword) { setAlert({ variant: "error", title: "Passwords don't match", message: "Please make sure both passwords match." }); return; }
    }

    setIsSubmitting(true);
    try {
      const payload = invitation?.existingUser
        ? { invitationToken: token }
        : { invitationToken: token, password };

      await usersService.acceptInvitation(payload);
      setAlert({ variant: "success", title: "Invitation accepted!", message: "Redirecting to sign in…" });
      setTimeout(() => router.push("/signin"), 1500);
    } catch (error) {
      setAlert({ variant: "error", title: "Unable to accept invitation", message: formatApiErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const companyName = invitation?.company?.name ?? "your company";
  const roleName = invitation?.role?.name ?? "member";
  const firstName = invitation?.firstName ?? "";

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto no-scrollbar">
      {/* Top nav */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <Link href="/signin" className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
          <ChevronLeftIcon />Back to sign in
        </Link>
        <span className="text-[12px] text-gray-400 dark:text-gray-600">FinanX</span>
      </div>

      {/* Form body */}
      <div className="flex flex-col justify-center flex-1 w-full max-w-[400px] mx-auto px-6 py-10">

        {/* Icon */}
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 mb-5">
          <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>

        {/* Validating spinner */}
        {isValidating && (
          <div className="flex flex-col items-center gap-3 py-8">
            <svg className="w-6 h-6 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-[13px] text-gray-500 dark:text-gray-400">Verifying your invitation…</p>
          </div>
        )}

        {/* Error state — invalid / expired / network error */}
        {!isValidating && !invitation && alert && (
          <div role="status" aria-live="polite">
            <Alert variant={alert.variant} title={alert.title} message={alert.message} />
            <p className="mt-5 text-[13px] text-center text-gray-500 dark:text-gray-400">
              <Link href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium transition-colors">Back to sign in</Link>
            </p>
          </div>
        )}

        {/* Valid invitation — show form */}
        {!isValidating && invitation?.valid && (
          <>
            {/* Heading — differs by existingUser */}
            <div className="mb-6">
              <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white mb-1.5">
                Join {companyName}
              </h1>
              {invitation.existingUser ? (
                <p className="text-[13px] text-gray-500 dark:text-gray-400">
                  Welcome back{firstName ? `, ${firstName}` : ""}! You already have a FinanX account.
                  Click below to join as{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{roleName}</span>.
                </p>
              ) : (
                <p className="text-[13px] text-gray-500 dark:text-gray-400">
                  Hi{firstName ? ` ${firstName}` : ""}! Set your password to join as{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{roleName}</span>.
                </p>
              )}
            </div>

            {alert && (
              <div className="mb-5" role="status" aria-live="polite">
                <Alert variant={alert.variant} title={alert.title} message={alert.message} />
              </div>
            )}

            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              {/* Password fields — only for new users */}
              {!invitation.existingUser && (
                <>
                  <div>
                    <Label>Password <span className="text-error-500">*</span></Label>
                    <div className="relative">
                      <Input
                        placeholder="Create a password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => { if (alert) setAlert(null); setPassword(e.target.value); }}
                        autoComplete="new-password"
                        disabled={isSubmitting}
                      />
                      <span onClick={() => setShowPassword(!showPassword)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-3 top-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showPassword ? <EyeIcon className="fill-current" /> : <EyeCloseIcon className="fill-current" />}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label>Confirm Password <span className="text-error-500">*</span></Label>
                    <div className="relative">
                      <Input
                        placeholder="Confirm your password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => { if (alert) setAlert(null); setConfirmPassword(e.target.value); }}
                        autoComplete="new-password"
                        disabled={isSubmitting}
                      />
                      <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-3 top-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showConfirmPassword ? <EyeIcon className="fill-current" /> : <EyeCloseIcon className="fill-current" />}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" size="md" disabled={isSubmitting}>
                {isSubmitting
                  ? "Joining…"
                  : invitation.existingUser
                    ? `Join ${companyName}`
                    : "Create account & join"}
              </Button>
            </form>

            <p className="mt-5 text-[13px] text-center text-gray-500 dark:text-gray-400">
              Already have an account?{" "}
              <Link href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium transition-colors">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
