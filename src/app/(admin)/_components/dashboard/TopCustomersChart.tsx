"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { TopCustomersData } from "@/types/dashboard";

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="mb-1 text-xs font-semibold text-gray-700 dark:text-white">{label}</p>
      {payload.map((p: { name: string; value: number; fill: string }) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-xs text-gray-500 dark:text-gray-400">{p.name}:</span>
          <span className="text-xs font-bold text-gray-900 dark:text-white">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

interface Props {
  data: TopCustomersData | null;
  loading?: boolean;
}

const TopCustomersChart: React.FC<Props> = ({ data, loading }) => {
  const chartData = data?.customers.slice(0, 8).map((c) => ({
    name: c.customerName.length > 14 ? c.customerName.substring(0, 12) + "…" : c.customerName,
    fullName: c.customerName,
    Revenue: c.totalRevenue,
    Paid: c.totalPaid,
    Outstanding: c.totalOutstanding,
    invoiceCount: c.invoiceCount,
  })) ?? [];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-50 dark:bg-success-900/20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Top Customers</h3>
      </div>

      {loading || !data ? (
        <div className="h-56 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      ) : chartData.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">No customer data for this period</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmt}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="Paid" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 dark:border-gray-700/60">
            {data.customers.slice(0, 5).map((c, i) => (
              <div key={c.customerId} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                    {i + 1}
                  </span>
                  <span className="font-medium text-gray-700 dark:text-gray-200">{c.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{c.invoiceCount} invoices</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{fmt(c.totalRevenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TopCustomersChart;
