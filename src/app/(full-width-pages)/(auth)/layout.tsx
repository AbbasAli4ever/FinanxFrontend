"use client";
import { ThemeProvider } from "@/context/ThemeContext";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
        {/* Left — form panel */}
        <div className="flex flex-col flex-1 lg:w-1/2 min-h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
          {children}
        </div>

        {/* Right — brand panel (desktop only) */}
        <div
          className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1a2b3c 0%, #233447 40%, #1e3347 100%)" }}
        >
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `linear-gradient(rgba(136,189,242,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(136,189,242,0.8) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
          {/* Glow circles */}
          <div className="absolute top-[-100px] right-[-100px] w-[360px] h-[360px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(136,189,242,0.12) 0%, transparent 70%)" }} />
          <div className="absolute bottom-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(106,137,167,0.12) 0%, transparent 70%)" }} />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center max-w-sm px-10 text-center">
            <Link href="/" className="mb-6 block">
              <Image
                width={40}
                height={40}
                src="/images/logo/f-logo.png"
                alt="FinanX"
                className="mx-auto"
              />
            </Link>
            <h2 className="text-[22px] font-bold text-white mb-2 tracking-tight">FinanX</h2>
            <p className="text-[13px] font-semibold mb-1.5" style={{ color: "#88bdf2" }}>
              Professional Financial Management
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: "rgba(189,221,252,0.55)" }}>
              Invoices, expenses, accounting, banking and more — all in one place for your business.
            </p>

            {/* Feature list */}
            <div className="mt-10 w-full space-y-2.5">
              {[
                "Full double-entry accounting",
                "Invoices, bills & expense tracking",
                "Multi-currency & banking sync",
                "Role-based access control",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-left">
                  <span
                    className="flex-shrink-0 flex items-center justify-center w-[18px] h-[18px] rounded-full"
                    style={{ background: "rgba(136,189,242,0.18)" }}
                  >
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#88bdf2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-[12px]" style={{ color: "rgba(189,221,252,0.7)" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Theme toggle */}
        <div className="fixed bottom-5 right-5 z-50">
          <ThemeToggleButton />
        </div>
      </div>
    </ThemeProvider>
  );
}
