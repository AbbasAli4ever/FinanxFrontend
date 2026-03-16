import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "404 — Page Not Found | FinanX",
  description: "The page you are looking for could not be found.",
};

export default function Error404() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#6a89a7 1px, transparent 1px), linear-gradient(90deg, #6a89a7 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[400px] text-center">
        {/* Error number */}
        <div className="mb-6">
          <span className="text-[80px] font-bold leading-none tracking-tight text-gray-200 dark:text-gray-800 select-none">
            404
          </span>
        </div>

        <Image
          src="/images/error/404.svg"
          alt="404"
          className="dark:hidden mx-auto mb-6"
          width={280}
          height={90}
        />
        <Image
          src="/images/error/404-dark.svg"
          alt="404"
          className="hidden dark:block mx-auto mb-6"
          width={280}
          height={90}
        />

        <h1 className="text-[18px] font-semibold text-gray-800 dark:text-white mb-2">
          Page not found
        </h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-8">
          We couldn&apos;t find the page you&apos;re looking for. It may have been moved or deleted.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 h-9 px-5 rounded border border-brand-500 bg-brand-500 text-[13px] font-medium text-white hover:bg-brand-600 hover:border-brand-600 transition-all duration-150 active:scale-[0.98]"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to dashboard
        </Link>
      </div>

      <p className="absolute bottom-6 text-[12px] text-gray-400 dark:text-gray-600">
        &copy; {new Date().getFullYear()} FinanX
      </p>
    </div>
  );
}
