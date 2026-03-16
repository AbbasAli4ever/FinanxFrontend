"use client";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
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
    <div className="flex flex-col flex-1 w-full overflow-y-auto no-scrollbar">
      {/* Top nav */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
        <span className="text-[12px] text-gray-400 dark:text-gray-600">FinanX</span>
      </div>

      {/* Form body */}
      <div className="flex flex-col justify-center flex-1 w-full max-w-[400px] mx-auto px-6 py-10">
        <div className="mb-7">
          <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white mb-1.5">Create account</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">Set up your company workspace</p>
        </div>

        {alert && (
          <div className="mb-5" role="status" aria-live="polite">
            <Alert variant={alert.variant} title={alert.title} message={alert.message} />
          </div>
        )}

        {/* Social buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button className="flex items-center justify-center gap-2 h-9 rounded border border-gray-200 bg-white text-[13px] text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z" fill="#4285F4" />
              <path d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z" fill="#34A853" />
              <path d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z" fill="#FBBC05" />
              <path d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z" fill="#EB4335" />
            </svg>
            Google
          </button>
          <button className="flex items-center justify-center gap-2 h-9 rounded border border-gray-200 bg-white text-[13px] text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
            <svg width="14" height="14" viewBox="0 0 21 20" fill="currentColor">
              <path d="M15.6705 1.875H18.4272L12.4047 8.75833L19.4897 18.125H13.9422L9.59717 12.4442L4.62554 18.125H1.86721L8.30887 10.7625L1.51221 1.875H7.20054L11.128 7.0675L15.6705 1.875ZM14.703 16.475H16.2305L6.37054 3.43833H4.73137L14.703 16.475Z" />
            </svg>
            X (Twitter)
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">or</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Company Name <span className="text-error-500">*</span></Label>
            <Input type="text" placeholder="Acme Inc." value={formState.companyName} onChange={handleInputChange("companyName")} autoComplete="organization" />
          </div>
          <div>
            <Label>Company Email <span className="text-gray-400 font-normal normal-case text-[11px]">(optional)</span></Label>
            <Input type="email" placeholder="contact@company.com" value={formState.companyEmail} onChange={handleInputChange("companyEmail")} autoComplete="email" />
          </div>
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
              <span onClick={() => setShowPassword(!showPassword)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-3 top-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showPassword ? <EyeIcon className="fill-current" /> : <EyeCloseIcon className="fill-current" />}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Checkbox checked={isChecked} onChange={setIsChecked} />
            <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed">
              By creating an account you agree to the{" "}
              <span className="text-gray-700 dark:text-gray-300 font-medium">Terms and Conditions</span> and{" "}
              <span className="text-gray-700 dark:text-gray-300 font-medium">Privacy Policy</span>
            </p>
          </div>
          <Button type="submit" className="w-full" size="md" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-[13px] text-center text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
