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
      setAlert({ variant: "success", title: "Invitation accepted!", message: "Redirecting to sign in..." });
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
    <div className="flex items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-lg shadow-brand-200/50 dark:bg-gray-800 dark:shadow-brand-950/30 mb-5">
            <Image src="/images/logo/f-logo.png" alt="FinanX" width={36} height={36} />
          </div>

          {!isValidating && invitation?.valid && (
            <>
              <h1 className="text-[26px] font-bold text-gray-900 dark:text-white tracking-tight">
                Join {companyName}
              </h1>
              <p className="mt-2 text-[14px] text-gray-500 dark:text-gray-400 text-center">
                {invitation.existingUser
                  ? `Welcome back${firstName ? `, ${firstName}` : ""}! Click below to join as ${roleName}.`
                  : `Hi${firstName ? ` ${firstName}` : ""}! Set your password to join as ${roleName}.`
                }
              </p>
            </>
          )}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-xl p-7 sm:p-8 shadow-xl shadow-gray-200/40 dark:border-gray-800/70 dark:bg-gray-900/80 dark:shadow-black/20">

          {/* Validating spinner */}
          {isValidating && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
              <p className="text-[13px] text-gray-500 dark:text-gray-400">Verifying your invitation...</p>
            </div>
          )}

          {/* Error state */}
          {!isValidating && !invitation && alert && (
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-100 dark:bg-error-500/20 mb-4">
                <svg className="h-5 w-5 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{alert.title}</h2>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6">{alert.message}</p>
              <Link href="/signin" className="w-full">
                <Button variant="outline" size="md" className="w-full">Back to sign in</Button>
              </Link>
            </div>
          )}

          {/* Valid invitation form */}
          {!isValidating && invitation?.valid && (
            <>
              {alert && (
                <div className="mb-5" role="status" aria-live="polite">
                  <Alert variant={alert.variant} title={alert.title} message={alert.message} />
                </div>
              )}

              <form noValidate onSubmit={handleSubmit} className="space-y-5">
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
                        <span onClick={() => setShowPassword(!showPassword)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-3 top-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
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
                        <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-3 top-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                          {showConfirmPassword ? <EyeIcon className="fill-current" /> : <EyeCloseIcon className="fill-current" />}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full" size="md" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Joining..."
                    : invitation.existingUser
                      ? `Join ${companyName}`
                      : "Create account & join"}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-[13px] text-center text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium transition-colors">Sign in</Link>
        </p>

        <p className="mt-5 text-center text-[11px] text-gray-400 dark:text-gray-600">
          FinanX — Professional Financial Management
        </p>
      </div>
    </div>
  );
}
