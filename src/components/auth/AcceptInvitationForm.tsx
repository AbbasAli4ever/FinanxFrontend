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

type AlertState = {
  variant: "success" | "error";
  title: string;
  message: string;
};

export default function AcceptInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setAlert({
        variant: "error",
        title: "Invalid invitation",
        message: "No invitation token found in URL. Please check your invitation link.",
      });
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAlert(null);

    if (!token) {
      setAlert({
        variant: "error",
        title: "Invalid invitation",
        message: "No invitation token found.",
      });
      return;
    }

    if (!password.trim()) {
      setAlert({
        variant: "error",
        title: "Password required",
        message: "Please enter a password.",
      });
      return;
    }

    if (password.length < 8) {
      setAlert({
        variant: "error",
        title: "Password too short",
        message: "Password must be at least 8 characters long.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setAlert({
        variant: "error",
        title: "Passwords don't match",
        message: "Please make sure both passwords match.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await usersService.acceptInvitation({
        invitationToken: token,
        password: password,
      });

      setAlert({
        variant: "success",
        title: "Account created successfully",
        message: "Redirecting to sign in...",
      });

      setTimeout(() => {
        router.push("/signin");
      }, 1500);
    } catch (error) {
      setAlert({
        variant: "error",
        title: "Unable to accept invitation",
        message: formatApiErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              Accept Invitation
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create your password to complete your account setup
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
                  Password<span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={!token || isSubmitting}
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
              </div>
              <div>
                <Label>
                  Confirm Password<span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Confirm your password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={!token || isSubmitting}
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
                  disabled={!token || isSubmitting}
                >
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Already have an account?
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
