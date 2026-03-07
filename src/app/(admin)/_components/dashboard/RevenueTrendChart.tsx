"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { RevenueTrend } from "@/types/dashboard";

function fmtY(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-xs text-gray-600 dark:text-gray-300">{p.name}:</span>
          <span className="text-xs font-bold text-gray-900 dark:text-white">{fmtY(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

interface Props {
  data: RevenueTrend | null;
  loading?: boolean;
}

const RevenueTrendChart: React.FC<Props> = ({ data, loading }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <div className="mb-5 flex items-center justify-between">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Revenue vs Expenses</h3>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Rolling 12-month trend</p>
      </div>
    </div>

    {loading || !data ? (
      <div className="flex h-64 items-center justify-center">
        <div className="h-48 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data.months} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.6} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: string) => v.split(" ")[0]}
          />
          <YAxis
            tickFormatter={fmtY}
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string) => (
              <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">{value}</span>
            )}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#3B82F6"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "#3B82F6" }}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            name="Expenses"
            stroke="#F59E0B"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "#F59E0B" }}
          />
        </LineChart>
      </ResponsiveContainer>
    )}
  </div>
);

export default RevenueTrendChart;
