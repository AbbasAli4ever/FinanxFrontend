"use client";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorMessage } from "@/utils/apiError";

const initialState = { companyName: "", companyEmail: "", firstName: "", lastName: "", email: "", password: "" };
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type AlertState = { variant: "success" | "error"; title: string; message: string };

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formState, setFormState] = useState(initialState);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (redirectTimer.current) clearTimeout(redirectTimer.current); }, []);

  const handleInputChange = (field: keyof typeof initialState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (alert) setAlert(null);
    setFormState((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAlert(null);
    if (!formState.companyName.trim()) { setAlert({ variant: "error", title: "Company name required", message: "Provide your company name to continue." }); return; }
    if (!formState.firstName.trim() || !formState.lastName.trim()) { setAlert({ variant: "error", title: "Name required", message: "Provide your full name to create the account." }); return; }
    if (!formState.email.trim()) { setAlert({ variant: "error", title: "Email missing", message: "Add an email address so we can contact you." }); return; }
    if (!emailRegex.test(formState.email.trim())) { setAlert({ variant: "error", title: "Invalid email", message: "Enter a valid email address." }); return; }
    if (formState.companyEmail.trim() && !emailRegex.test(formState.companyEmail.trim())) { setAlert({ variant: "error", title: "Invalid company email", message: "Enter a valid company contact email or leave the field empty." }); return; }
    if (formState.password.length < 8) { setAlert({ variant: "error", title: "Password too short", message: "Password must be at least 8 characters long." }); return; }
    setIsSubmitting(true);
    try {
      await register({
        company: { name: formState.companyName.trim(), email: formState.companyEmail.trim() || undefined },
        user: { firstName: formState.firstName.trim(), lastName: formState.lastName.trim(), email: formState.email.trim(), password: formState.password },
      });
      setAlert({ variant: "success", title: "Account created", message: "Registration successful. Redirecting to dashboard..." });
      redirectTimer.current = setTimeout(() => router.replace("/"), 950);
    } catch (error) {
      setAlert({ variant: "error", title: "Unable to register", message: formatApiErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-[440px]">
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
            Create your workspace
          </h1>
          <p className="mt-2 text-[14px] text-gray-500 dark:text-gray-400">
            Get started with FinanX in seconds
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
            {/* Company section */}
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-500 dark:text-brand-400">Company</p>
              <div>
                <Label>Company Name <span className="text-error-500">*</span></Label>
                <Input type="text" placeholder="Acme Inc." value={formState.companyName} onChange={handleInputChange("companyName")} autoComplete="organization" />
              </div>
              <div>
                <Label>Company Email <span className="text-gray-400 font-normal normal-case text-[11px]">(optional)</span></Label>
                <Input type="email" placeholder="contact@company.com" value={formState.companyEmail} onChange={handleInputChange("companyEmail")} autoComplete="email" />
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 dark:bg-gray-800" />

            {/* Personal section */}
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-500 dark:text-brand-400">Your Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>First Name <span className="text-error-500">*</span></Label>
                  <Input type="text" placeholder="John" value={formState.firstName} onChange={handleInputChange("firstName")} autoComplete="given-name" />
                </div>
                <div>
                  <Label>Last Name <span className="text-error-500">*</span></Label>
                  <Input type="text" placeholder="Doe" value={formState.lastName} onChange={handleInputChange("lastName")} autoComplete="family-name" />
                </div>
              </div>
              <div>
                <Label>Email <span className="text-error-500">*</span></Label>
                <Input type="email" placeholder="you@company.com" value={formState.email} onChange={handleInputChange("email")} autoComplete="email" />
              </div>
              <div>
                <Label>Password <span className="text-error-500">*</span></Label>
                <div className="relative">
                  <Input placeholder="Min. 8 characters" type={showPassword ? "text" : "password"} value={formState.password} onChange={handleInputChange("password")} autoComplete="new-password" />
                  <span onClick={() => setShowPassword(!showPassword)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-3 top-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    {showPassword ? <EyeIcon className="fill-current" /> : <EyeCloseIcon className="fill-current" />}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Checkbox checked={isChecked} onChange={setIsChecked} />
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                I agree to the{" "}
                <span className="text-gray-700 dark:text-gray-300 font-medium">Terms of Service</span> and{" "}
                <span className="text-gray-700 dark:text-gray-300 font-medium">Privacy Policy</span>
              </p>
            </div>

            <Button type="submit" className="w-full" size="md" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </div>

        {/* Sign in link */}
        <p className="mt-6 text-[13px] text-center text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium transition-colors">
            Sign in
          </Link>
        </p>

        {/* Footer */}
        <p className="mt-5 text-center text-[11px] text-gray-400 dark:text-gray-600">
          FinanX — Professional Financial Management
        </p>
      </div>
    </div>
  );
}
