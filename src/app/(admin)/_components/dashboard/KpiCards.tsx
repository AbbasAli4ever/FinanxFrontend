"use client";

import React from "react";
import type { FinancialOverview, PeriodValue, ChangeDirection } from "@/types/dashboard";

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface ChangeBadgeProps {
  direction: ChangeDirection;
  percent: number | null;
  invertColors?: boolean; // for expenses: up is bad
}

const ChangeBadge: React.FC<ChangeBadgeProps> = ({ direction, percent, invertColors }) => {
  if (direction === "new") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
        New
      </span>
    );
  }
  if (direction === "flat") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
        — Flat
      </span>
    );
  }

  const isUp = direction === "up";
  const isGood = invertColors ? !isUp : isUp;

  const colorCls = isGood
    ? "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400"
    : "bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-400";

  return (
    <span className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-[11px] font-semibold ${colorCls}`}>
      {isUp ? (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      )}
      {percent !== null ? `${Math.abs(percent).toFixed(1)}%` : ""}
    </span>
  );
};

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  pv?: PeriodValue;
  invertColors?: boolean;
  icon: React.ReactNode;
  bgClass: string;
  iconColor: string;
  loading?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, pv, invertColors, icon, bgClass, iconColor, loading }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
        {loading ? (
          <div className="mt-2 h-8 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        ) : (
          <p className="mt-1 text-[22px] font-bold text-gray-900 dark:text-white">{value}</p>
        )}
        {subtitle && !loading && (
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
        )}
      </div>
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded ${bgClass}`}>
        <span className={iconColor}>{icon}</span>
      </div>
    </div>
    {pv && !loading && (
      <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-700/60">
        <ChangeBadge direction={pv.changeDirection} percent={pv.changePercent} invertColors={invertColors} />
        <span className="text-xs text-gray-500 dark:text-gray-400">vs previous period</span>
      </div>
    )}
  </div>
);

interface Props {
  data: FinancialOverview | null;
  loading?: boolean;
}

const KpiCards: React.FC<Props> = ({ data, loading }) => {
  const cards: KpiCardProps[] = [
    {
      title: "Revenue",
      value: data ? fmt(data.revenue.current) : "—",
      pv: data?.revenue,
      invertColors: false,
      bgClass: "bg-brand-50 dark:bg-brand-900/20",
      iconColor: "text-brand-600 dark:text-brand-400",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      title: "Expenses",
      value: data ? fmt(data.expenses.current) : "—",
      pv: data?.expenses,
      invertColors: true,
      bgClass: "bg-warning-50 dark:bg-warning-900/20",
      iconColor: "text-warning-600 dark:text-warning-400",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      ),
    },
    {
      title: "Net Income",
      value: data ? fmt(data.netIncome.current) : "—",
      pv: data?.netIncome,
      invertColors: false,
      bgClass: "bg-success-50 dark:bg-success-900/20",
      iconColor: "text-success-600 dark:text-success-400",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      ),
    },
    {
      title: "Cash Balance",
      value: data ? fmt(data.cashBalance) : "—",
      subtitle: "Across all accounts",
      bgClass: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      ),
    },
    {
      title: "Accounts Receivable",
      value: data ? fmt(data.totalAR) : "—",
      subtitle: "Outstanding invoices",
      bgClass: "bg-sky-50 dark:bg-sky-900/20",
      iconColor: "text-sky-600 dark:text-sky-400",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      title: "Accounts Payable",
      value: data ? fmt(data.totalAP) : "—",
      subtitle: "Outstanding bills",
      bgClass: "bg-rose-50 dark:bg-rose-900/20",
      iconColor: "text-rose-600 dark:text-rose-400",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 14 4 9l5-5" />
          <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => (
        <KpiCard key={c.title} {...c} loading={loading} />
      ))}
    </div>
  );
};

export default KpiCards;
