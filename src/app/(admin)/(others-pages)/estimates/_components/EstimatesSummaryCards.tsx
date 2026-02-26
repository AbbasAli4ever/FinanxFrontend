"use client";

import React from "react";
import type { EstimateSummary } from "@/types/estimates";

interface EstimatesSummaryCardsProps {
  summary: EstimateSummary | null;
  loading?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

const EstimatesSummaryCards: React.FC<EstimatesSummaryCardsProps> = ({ summary, loading }) => {
  const pendingCount = (summary?.sent.count ?? 0) + (summary?.viewed.count ?? 0);

  const cards = [
    {
      label: "Draft",
      value: loading ? "—" : String(summary?.draft.count ?? 0),
      sub: "awaiting send",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      iconBg: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
      cardBg: "bg-white dark:bg-gray-900",
      border: "border-gray-200 dark:border-gray-800",
    },
    {
      label: "Pending",
      value: loading ? "—" : String(pendingCount),
      sub: loading ? "—" : formatCurrency(summary?.totals.totalPending ?? 0),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      cardBg: "bg-white dark:bg-gray-900",
      border: "border-gray-200 dark:border-gray-800",
    },
    {
      label: "Accepted",
      value: loading ? "—" : String(summary?.accepted.count ?? 0),
      sub: loading ? "—" : formatCurrency(summary?.accepted.amount ?? 0),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: "bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400",
      cardBg: "bg-white dark:bg-gray-900",
      border: "border-gray-200 dark:border-gray-800",
    },
    {
      label: "Converted",
      value: loading ? "—" : String(summary?.converted.count ?? 0),
      sub: loading ? "—" : formatCurrency(summary?.converted.amount ?? 0),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      ),
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
      cardBg: "bg-white dark:bg-gray-900",
      border: "border-gray-200 dark:border-gray-800",
    },
    {
      label: "Expiring Soon",
      value: loading ? "—" : String(summary?.expiring.count ?? 0),
      sub: loading ? "—" : formatCurrency(summary?.expiring.amount ?? 0),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      iconBg: "bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400",
      cardBg: "bg-warning-50/40 dark:bg-warning-900/10",
      border: "border-warning-200 dark:border-warning-800",
    },
    {
      label: "Conversion Rate",
      value: loading ? "—" : `${(summary?.totals.conversionRate ?? 0).toFixed(1)}%`,
      sub: loading ? "—" : `${formatCurrency(summary?.totals.totalEstimated ?? 0)} total estimated`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      iconBg: "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400",
      cardBg: "bg-white dark:bg-gray-900",
      border: "border-gray-200 dark:border-gray-800",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border p-4 ${card.cardBg} ${card.border}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}>
              {card.icon}
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-2xl font-bold tabular-nums ${loading ? "animate-pulse text-gray-300" : "text-gray-900 dark:text-white"}`}>
              {card.value}
            </p>
            <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
            {card.sub && (
              <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">{card.sub}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EstimatesSummaryCards;
