// Registration is currently closed (private deployment).
// Uncomment the lines below when ready for public launch:
// import SignUpForm from "@/components/auth/SignUpForm";
// export default function SignUp() { return <SignUpForm />; }

import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Registration Closed | FinanX",
  description: "FinanX is currently invite-only.",
};

export default function SignUp() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-screen px-6 text-center">
      <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-5">
        <svg className="w-7 h-7 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75A4.5 4.5 0 008.25 5.25v1.5M3.75 10.5h16.5M5.25 10.5v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9" />
        </svg>
      </span>
      <h1 className="text-[20px] font-semibold text-gray-900 dark:text-white mb-2">
        Registration is closed
      </h1>
      <p className="text-[14px] text-gray-500 dark:text-gray-400 max-w-[320px] leading-relaxed">
        FinanX is currently invite-only. Contact your administrator to get access.
      </p>
      <Link
        href="/signin"
        className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 transition-colors"
      >
        ← Back to sign in
      </Link>
    </div>
  );
}
