"use client";
import { ThemeProvider } from "@/context/ThemeContext";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#f5f8fc] dark:bg-gray-950">
        {/* Animated mesh gradient background */}
        <div className="pointer-events-none absolute inset-0">
          {/* Large top-left orb */}
          <div
            className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full opacity-40 dark:opacity-15 blur-3xl"
            style={{ background: "radial-gradient(circle, #bdddfc 0%, transparent 70%)" }}
          />
          {/* Bottom-right accent */}
          <div
            className="absolute -bottom-[15%] -right-[10%] w-[500px] h-[500px] rounded-full opacity-30 dark:opacity-10 blur-3xl"
            style={{ background: "radial-gradient(circle, #88bdf2 0%, transparent 70%)" }}
          />
          {/* Center subtle glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-20 dark:opacity-[0.06] blur-3xl"
            style={{ background: "radial-gradient(ellipse, #d5e8f7 0%, transparent 70%)" }}
          />
          {/* Subtle dot grid */}
          <div
            className="absolute inset-0 opacity-[0.35] dark:opacity-[0.08]"
            style={{
              backgroundImage: "radial-gradient(circle, #6a89a7 0.5px, transparent 0.5px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full">
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}
