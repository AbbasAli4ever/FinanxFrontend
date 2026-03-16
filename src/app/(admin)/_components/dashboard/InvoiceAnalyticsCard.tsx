"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { InvoiceAnalytics } from "@/types/dashboard";

const STATUS_COLORS: Record<string, string> = {
  PAID: "#10B981",
  SENT: "#6A89A7",
  PARTIALLY_PAID: "#8B5CF6",
  OVERDUE: "#EF4444",
  DRAFT: "#94A3B8",
  VOID: "#6B7280",
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="text-xs font-semibold text-gray-700 dark:text-white">{d.name}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{d.payload.count} invoices · {fmt(d.value)}</p>
    </div>
  );
};

interface Props {
  data: InvoiceAnalytics | null;
  loading?: boolean;
}

const InvoiceAnalyticsCard: React.FC<Props> = ({ data, loading }) => {
  const pieData = data?.statusBreakdown.map((s) => ({
    name: s.status.replace(/_/g, " "),
    value: s.totalAmount,
    count: s.count,
    status: s.status,
  })) ?? [];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-50 dark:bg-brand-900/20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6A89A7" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">Invoice Analytics</h3>
      </div>

      {loading || !data ? (
        <div className="space-y-3">
          <div className="mx-auto h-40 w-40 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] ?? "#94A3B8"}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(v: string) => <span className="text-[11px] text-gray-600 dark:text-gray-300">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 dark:border-gray-700/60">
            <div className="rounded bg-gray-50 p-3 dark:bg-gray-800/60">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Total Invoiced</p>
              <p className="text-[18px] font-bold text-gray-900 dark:text-white">{fmt(data.totalInvoiced)}</p>
            </div>
            <div className="rounded bg-success-50/60 p-3 dark:bg-success-900/20">
              <p className="text-[10px] uppercase tracking-wide text-success-600 dark:text-success-400">Collected</p>
              <p className="text-[18px] font-bold text-success-700 dark:text-success-300">{fmt(data.totalCollected)}</p>
            </div>
            <div className="rounded bg-error-50/60 p-3 dark:bg-error-900/20">
              <p className="text-[10px] uppercase tracking-wide text-error-600 dark:text-error-400">Overdue</p>
              <p className="text-[18px] font-bold text-error-700 dark:text-error-300">
                {fmt(data.overdueAmount)}
                <span className="ml-1 text-xs font-normal text-error-500">({data.overdueCount})</span>
              </p>
            </div>
            <div className="rounded bg-brand-50/60 p-3 dark:bg-brand-900/20">
              <p className="text-[10px] uppercase tracking-wide text-brand-600 dark:text-brand-400">Collection Rate</p>
              <p className="text-[18px] font-bold text-brand-700 dark:text-brand-300">{data.collectionRate.toFixed(1)}%</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InvoiceAnalyticsCard;
