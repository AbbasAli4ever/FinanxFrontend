"use client";

import React from "react";
import type { DebitNoteSummary } from "@/types/debitNotes";

interface DebitNotesSummaryCardsProps {
  summary: DebitNoteSummary | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const DebitNotesSummaryCards: React.FC<DebitNotesSummaryCardsProps> = ({ summary }) => {
  if (!summary) return null;

  const cards = [
    {
      label: "Draft",
      value: summary.draft.count.toString(),
      subtitle: `${formatCurrency(summary.draft.totalAmount)} total`,
      colorClass: "text-gray-600 dark:text-gray-300",
      bgClass: "bg-gray-50 dark:bg-gray-800/40",
      iconBg: "bg-gray-100 dark:bg-gray-700",
      icon: (
        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      label: "Open",
      value: formatCurrency(summary.open.remainingDebit ?? summary.open.totalAmount),
      subtitle: `${summary.open.count} notes · ${formatCurrency(summary.open.totalAmount)} issued`,
      colorClass: "text-brand-600 dark:text-brand-400",
      bgClass: "bg-brand-50 dark:bg-brand-900/20",
      iconBg: "bg-brand-100 dark:bg-brand-800/30",
      icon: (
        <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Partial",
      value: formatCurrency(summary.partiallyApplied.remainingDebit ?? summary.partiallyApplied.totalAmount),
      subtitle: `${summary.partiallyApplied.count} notes · remaining`,
      colorClass: "text-warning-600 dark:text-warning-400",
      bgClass: "bg-warning-50 dark:bg-warning-900/20",
      iconBg: "bg-warning-100 dark:bg-warning-800/30",
      icon: (
        <svg className="h-5 w-5 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
    },
    {
      label: "Applied",
      value: formatCurrency(summary.applied.totalAmount),
      subtitle: `${summary.applied.count} notes fully applied`,
      colorClass: "text-success-600 dark:text-success-400",
      bgClass: "bg-success-50 dark:bg-success-900/20",
      iconBg: "bg-success-100 dark:bg-success-800/30",
      icon: (
        <svg className="h-5 w-5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
    },
    {
      label: "Outstanding",
      value: formatCurrency(summary.totalOutstandingDebit),
      subtitle: "total remaining debit",
      colorClass: "text-orange-600 dark:text-orange-400",
      bgClass: "bg-orange-50 dark:bg-orange-900/20",
      iconBg: "bg-orange-100 dark:bg-orange-800/30",
      icon: (
        <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-2xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 ${card.bgClass}`}>
          <div className="flex items-start justify-between">
            <div className={`rounded-lg p-2 ${card.iconBg}`}>{card.icon}</div>
          </div>
          <p className={`mt-3 text-xl font-bold tabular-nums ${card.colorClass}`}>{card.value}</p>
          <p className="mt-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">{card.label}</p>
          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
};

export default DebitNotesSummaryCards;
