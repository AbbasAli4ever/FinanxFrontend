"use client";

import React from "react";
import type { ProjectOverview } from "@/types/dashboard";

const STATUS_COLOR: Record<string, { text: string; bg: string; dot: string }> = {
  ACTIVE: {
    text: "text-success-700 dark:text-success-400",
    bg: "bg-success-50 dark:bg-success-900/20",
    dot: "bg-success-500",
  },
  ON_HOLD: {
    text: "text-warning-700 dark:text-warning-400",
    bg: "bg-warning-50 dark:bg-warning-900/20",
    dot: "bg-warning-400",
  },
  COMPLETED: {
    text: "text-brand-700 dark:text-brand-400",
    bg: "bg-brand-50 dark:bg-brand-900/20",
    dot: "bg-brand-500",
  },
  CANCELLED: {
    text: "text-gray-500 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-700",
    dot: "bg-gray-400",
  },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function clamp(v: number): number {
  return Math.min(100, Math.max(0, v));
}

interface Props {
  data: ProjectOverview | null;
  loading?: boolean;
}

const ProjectOverviewCard: React.FC<Props> = ({ data, loading }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <div className="mb-4 flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-50 dark:bg-brand-900/20">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6A89A7" strokeWidth="2">
          <rect x="2" y="3" width="6" height="6" rx="1" />
          <rect x="16" y="3" width="6" height="6" rx="1" />
          <rect x="9" y="14" width="6" height="7" rx="1" />
          <path d="M5 9v4c0 1.1.9 2 2 2h10a2 2 0 0 0 2-2V9" />
          <path d="M12 13v1" />
        </svg>
      </div>
      <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">Project Overview</h3>
    </div>

    {loading || !data ? (
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    ) : (
      <>
        {/* Status summary */}
        <div className="mb-4 grid grid-cols-4 gap-2">
          {(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] as const).map((status) => {
            const sc = STATUS_COLOR[status];
            return (
              <div key={status} className={`rounded p-3 text-center ${sc.bg}`}>
                <p className={`text-2xl font-bold ${sc.text}`}>{data.summary[status]}</p>
                <p className={`text-[10px] font-medium ${sc.text}`}>{status.replace("_", " ")}</p>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="mb-4 flex items-center gap-4 rounded bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Billable Hours</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{data.summary.totalBillableHours.toFixed(1)}h</p>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Billable Revenue</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{fmt(data.summary.totalBillableRevenue)}</p>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Total Projects</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{data.summary.totalProjects}</p>
          </div>
        </div>

        {/* Project burn bars */}
        <div className="space-y-3">
          {data.projects.slice(0, 6).map((p) => {
            const sc = STATUS_COLOR[p.status] ?? STATUS_COLOR.CANCELLED;
            const burn = clamp(p.hoursBurnPercent);
            return (
              <div key={p.projectId} className="rounded border border-gray-100 p-3 dark:border-gray-700/60">
                <div className="mb-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                      <p className="truncate text-xs font-semibold text-gray-800 dark:text-white">{p.name}</p>
                    </div>
                    {p.customer && (
                      <p className="ml-3 text-[10px] text-gray-400">{p.customer.displayName} · {p.projectNumber}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${sc.text} ${sc.bg}`}>
                      {p.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {p.budgetHours && (
                  <div>
                    <div className="mb-0.5 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                      <span>{p.hoursLogged.toFixed(0)}h / {p.budgetHours}h logged</span>
                      <span className={burn > 90 ? "font-bold text-error-600 dark:text-error-400" : burn > 70 ? "font-bold text-warning-600" : "text-gray-400"}>
                        {burn.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                      <div
                        className={`h-1.5 rounded-full ${burn > 90 ? "bg-error-500" : burn > 70 ? "bg-warning-400" : "bg-brand-500"}`}
                        style={{ width: `${burn}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-1.5 flex items-center gap-3 text-[10px] text-gray-400">
                  <span>Invoiced: <span className="font-semibold text-gray-600 dark:text-gray-300">{fmt(p.invoicedRevenue)}</span></span>
                  <span>Expenses: <span className="font-semibold text-gray-600 dark:text-gray-300">{fmt(p.expensesIncurred)}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      </>
    )}
  </div>
);

export default ProjectOverviewCard;
