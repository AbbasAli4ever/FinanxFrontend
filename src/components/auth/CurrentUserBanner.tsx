"use client";

import { useAuth } from "@/context/AuthContext";

export default function CurrentUserBanner() {
  const { user, isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-5 text-sm text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-300">
        Loading your profile...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white/70 p-5 text-sm text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Guest view</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sign in or create an account to unlock the FinanX dashboard experience.
        </p>
      </div>
    );
  }

  const permissions = user.permissions?.length ?? 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
        Signed in as
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
        {user.firstName} {user.lastName}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
        <span className="rounded-full border border-dashed border-gray-300 px-3 py-1 dark:border-white/25">
          {user.company?.name ?? "No company"}
        </span>
        <span className="rounded-full border border-dashed border-gray-300 px-3 py-1 dark:border-white/25">
          {user.role?.name ?? "Company member"}
        </span>
      </div>
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
        {permissions} permission{permissions === 1 ? "" : "s"} assigned
      </p>
    </div>
  );
}
