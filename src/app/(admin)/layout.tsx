"use client";

import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isReady, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/signin");
    }
  }, [isReady, isAuthenticated, router]);

  // Still verifying token with backend — show nothing
  if (!isReady) {
    return null;
  }

  // Auth check done, not authenticated — show nothing while redirect fires
  if (!token || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <div className="flex-1 ml-[90px]">
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}
