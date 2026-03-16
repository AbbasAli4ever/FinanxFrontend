"use client";

import React from "react";
import type { RecentActivity, ActivityType } from "@/types/dashboard";

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const TYPE_META: Record<ActivityType, { icon: React.ReactNode; bg: string; color: string }> = {
  INVOICE: {
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    bg: "bg-brand-50 dark:bg-brand-900/30",
    color: "text-brand-600 dark:text-brand-400",
  },
  BILL: {
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
      </svg>
    ),
    bg: "bg-warning-50 dark:bg-warning-900/30",
    color: "text-warning-600 dark:text-warning-400",
  },
  EXPENSE: {
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    bg: "bg-purple-50 dark:bg-purple-900/30",
    color: "text-purple-600 dark:text-purple-400",
  },
  PAYMENT: {
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    bg: "bg-success-50 dark:bg-success-900/30",
    color: "text-success-600 dark:text-success-400",
  },
  JOURNAL_ENTRY: {
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    bg: "bg-gray-100 dark:bg-gray-700",
    color: "text-gray-500 dark:text-gray-400",
  },
};

const STATUS_COLOR: Record<string, string> = {
  PAID: "text-success-600 dark:text-success-400",
  RECEIVED: "text-brand-600 dark:text-brand-400",
  SENT: "text-brand-600 dark:text-brand-400",
  APPROVED: "text-success-600 dark:text-success-400",
  POSTED: "text-success-600 dark:text-success-400",
  OVERDUE: "text-error-600 dark:text-error-400",
  DRAFT: "text-gray-500 dark:text-gray-400",
};

interface Props {
  data: RecentActivity | null;
  loading?: boolean;
}

const RecentActivityFeed: React.FC<Props> = ({ data, loading }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <div className="mb-4 flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 dark:bg-gray-700">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </svg>
      </div>
      <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
    </div>

    {loading || !data ? (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              <div className="h-2.5 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    ) : data.activities.length === 0 ? (
      <p className="py-12 text-center text-sm text-gray-400">No recent activity</p>
    ) : (
      <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1">
        {data.activities.map((a) => {
          const meta = TYPE_META[a.type] ?? TYPE_META.JOURNAL_ENTRY;
          return (
            <div key={a.id} className="flex items-start gap-3">
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded ${meta.bg} ${meta.color}`}>
                {meta.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate text-xs font-semibold text-gray-800 dark:text-white">
                    {a.label}
                  </p>
                  <span className="whitespace-nowrap text-[10px] text-gray-400">{timeAgo(a.occurredAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">{a.description}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-medium ${STATUS_COLOR[a.status] ?? "text-gray-500"}`}>
                      {a.status}
                    </span>
                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200">{fmt(a.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

export default RecentActivityFeed;
