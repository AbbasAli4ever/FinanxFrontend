"use client";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Alert from "@/components/ui/alert/Alert";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorMessage } from "@/utils/apiError";

const initialState = { email: "", password: "" };
type AlertState = { variant: "success" | "error"; title: string; message: string };
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formState, setFormState] = useState(initialState);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => () => { if (redirectTimer.current) clearTimeout(redirectTimer.current); }, []);

  const handleChange = (field: keyof typeof initialState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (alert) setAlert(null);
    setFormState((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAlert(null);
    if (!formState.email || !formState.password) {
      setAlert({ variant: "error", title: "Missing information", message: "Provide both email and password to continue." });
      return;
    }
    const normalizedEmail = formState.email.trim();
    if (!emailRegex.test(normalizedEmail)) {
      setAlert({ variant: "error", title: "Invalid email", message: "Enter a valid email address." });
      return;
    }
    if (formState.password.length < 8) {
      setAlert({ variant: "error", title: "Password too short", message: "Password must be at least 8 characters long." });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await login({ email: normalizedEmail, password: formState.password });
      if (result.requiresCompanySelection) {
        setAlert({ variant: "success", title: "Multiple companies found", message: "Please select a company to continue." });
        redirectTimer.current = setTimeout(() => router.replace("/select-company"), 600);
      } else {
        setAlert({ variant: "success", title: "Signed in", message: "Welcome back! Redirecting to your dashboard." });
        redirectTimer.current = setTimeout(() => router.replace("/"), 850);
      }
    } catch (error) {
      setAlert({ variant: "error", title: "Unable to sign in", message: formatApiErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-lg shadow-brand-200/50 dark:bg-gray-800 dark:shadow-brand-950/30 mb-5">
            <Image
              src="/images/logo/f-logo.png"
              alt="FinanX"
              width={36}
              height={36}
            />
          </div>
          <h1 className="text-[26px] font-bold text-gray-900 dark:text-white tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-[14px] text-gray-500 dark:text-gray-400">
            Sign in to continue to FinanX
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
              <Label>Email <span className="text-error-500">*</span></Label>
              <Input
                placeholder="you@company.com"
                type="email"
                autoComplete="email"
                value={formState.email}
                onChange={handleChange("email")}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Password <span className="text-error-500">*</span></Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formState.password}
                  autoComplete="current-password"
                  onChange={handleChange("password")}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-3 top-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeIcon className="fill-current" /> : <EyeCloseIcon className="fill-current" />}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Checkbox checked={isChecked} onChange={setIsChecked} />
              <span className="text-[13px] text-gray-600 dark:text-gray-400">Keep me logged in</span>
            </div>

            <Button type="submit" className="w-full" size="md" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 flex items-center justify-center gap-6">
          {[
            { icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            ), text: "256-bit SSL" },
            { icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            ), text: "SOC 2 Ready" },
            { icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
              </svg>
            ), text: "99.9% Uptime" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-1.5 text-gray-400 dark:text-gray-600">
              <span className="text-brand-400 dark:text-brand-600">{item.icon}</span>
              <span className="text-[11px] font-medium tracking-wide">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-gray-400 dark:text-gray-600">
          FinanX — Professional Financial Management
        </p>
      </div>
    </div>
  );
}
