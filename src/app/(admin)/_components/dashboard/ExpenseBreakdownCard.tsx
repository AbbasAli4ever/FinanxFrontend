"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { ExpenseBreakdown } from "@/types/dashboard";

const CAT_COLORS = [
  "#6A89A7", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444",
  "#06B6D4", "#EC4899", "#84CC16", "#F97316", "#6B7280",
];

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CatTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="text-xs font-semibold text-gray-700 dark:text-white">{d.name}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{fmt(d.value)} · {d.payload.percentage?.toFixed(1)}%</p>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xs font-bold text-gray-900 dark:text-white">{fmt(payload[0].value)}</p>
    </div>
  );
};

interface Props {
  data: ExpenseBreakdown | null;
  loading?: boolean;
}

const ExpenseBreakdownCard: React.FC<Props> = ({ data, loading }) => {
  const pieData = data?.byCategory.map((c, i) => ({
    name: c.categoryName,
    value: c.amount,
    percentage: c.percentage,
    color: CAT_COLORS[i % CAT_COLORS.length],
  })) ?? [];

  const trendData = data?.monthlyTrend.map((m) => ({
    label: m.label.split(" ")[0],
    amount: m.amount,
  })) ?? [];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-error-50 dark:bg-error-900/20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">Expense Breakdown</h3>
        {data && (
          <span className="ml-auto text-sm font-semibold text-gray-700 dark:text-gray-200">
            {fmt(data.totalExpenses)} total
          </span>
        )}
      </div>

      {loading || !data ? (
        <div className="space-y-4">
          <div className="mx-auto h-36 w-36 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            {/* Pie */}
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CatTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex w-44 flex-col justify-center space-y-1.5">
              {pieData.slice(0, 6).map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: entry.color }} />
                  <span className="flex-1 truncate text-gray-600 dark:text-gray-300">{entry.name}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{entry.percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly trend bars */}
          {trendData.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">Monthly Trend</p>
              <ResponsiveContainer width="100%" height={90}>
                <BarChart data={trendData} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.4} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={fmt}
                    tick={{ fontSize: 9, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Bar dataKey="amount" fill="#EF4444" radius={[3, 3, 0, 0]} maxBarSize={18} opacity={0.75} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpenseBreakdownCard;
