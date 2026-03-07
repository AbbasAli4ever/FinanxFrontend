"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { CashFlowOverview } from "@/types/dashboard";

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
      {payload.map((p: { name: string; value: number; fill: string }) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-xs text-gray-600 dark:text-gray-300">{p.name}:</span>
          <span className="text-xs font-bold text-gray-900 dark:text-white">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

interface Props {
  data: CashFlowOverview | null;
  loading?: boolean;
}

const CashFlowCard: React.FC<Props> = ({ data, loading }) => {
  const chartData = data?.dailyFlow.map((d) => ({
    date: fmtDate(d.date),
    Inflow: d.inflow,
    Outflow: d.outflow,
    Net: d.inflow - d.outflow,
  })) ?? [];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Cash Flow</h3>
        <span className="ml-auto text-xs text-gray-400">Last 30 days</span>
      </div>

      {/* Bank account summary */}
      {loading || !data ? (
        <div className="mb-4 space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="mb-4 space-y-2">
          {data.bankAccounts.map((acc) => (
            <div
              key={acc.accountId}
              className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60"
            >
              <div>
                <p className="text-xs font-medium text-gray-800 dark:text-white">{acc.name}</p>
                {acc.institution && (
                  <p className="text-[10px] text-gray-400">{acc.institution}{acc.last4 ? ` ···${acc.last4}` : ""}</p>
                )}
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{fmt(acc.currentBalance)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2 dark:bg-brand-900/20">
            <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">Total Cash</p>
            <p className="text-sm font-bold text-brand-700 dark:text-brand-300">{fmt(data.totalCashBalance)}</p>
          </div>
        </div>
      )}

      {/* 30-day stats */}
      {!loading && data && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-success-50/60 p-2.5 text-center dark:bg-success-900/20">
            <p className="text-[10px] uppercase tracking-wide text-success-600 dark:text-success-400">In</p>
            <p className="text-sm font-bold text-success-700 dark:text-success-300">{fmt(data.last30Days.totalInflow)}</p>
          </div>
          <div className="rounded-xl bg-error-50/60 p-2.5 text-center dark:bg-error-900/20">
            <p className="text-[10px] uppercase tracking-wide text-error-600 dark:text-error-400">Out</p>
            <p className="text-sm font-bold text-error-700 dark:text-error-300">{fmt(data.last30Days.totalOutflow)}</p>
          </div>
          <div className={`rounded-xl p-2.5 text-center ${data.last30Days.netCashFlow >= 0 ? "bg-brand-50/60 dark:bg-brand-900/20" : "bg-warning-50/60 dark:bg-warning-900/20"}`}>
            <p className={`text-[10px] uppercase tracking-wide ${data.last30Days.netCashFlow >= 0 ? "text-brand-600 dark:text-brand-400" : "text-warning-600 dark:text-warning-400"}`}>Net</p>
            <p className={`text-sm font-bold ${data.last30Days.netCashFlow >= 0 ? "text-brand-700 dark:text-brand-300" : "text-warning-700 dark:text-warning-300"}`}>
              {data.last30Days.netCashFlow >= 0 ? "+" : ""}{fmt(data.last30Days.netCashFlow)}
            </p>
          </div>
        </div>
      )}

      {/* Daily flow chart */}
      {loading || !data ? (
        <div className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="cfIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cfOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.4} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              interval={6}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fontSize: 9, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="Inflow"
              stroke="#10B981"
              strokeWidth={1.5}
              fill="url(#cfIn)"
            />
            <Area
              type="monotone"
              dataKey="Outflow"
              stroke="#EF4444"
              strokeWidth={1.5}
              fill="url(#cfOut)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="py-6 text-center text-sm text-gray-400">No transaction data available</p>
      )}
    </div>
  );
};

export default CashFlowCard;
