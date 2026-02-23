"use client";

import React from "react";
import type { BillSummary } from "@/types/bills";

interface BillSummaryCardsProps {
  summary: BillSummary | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const BillSummaryCards: React.FC<BillSummaryCardsProps> = ({ summary }) => {
  if (!summary) return null;

  const cards = [
    {
      label: "Draft",
      value: summary.draft.count.toString(),
      subtitle: "bills",
      colorClass: "text-brand-500",
      bgClass: "bg-brand-50 dark:bg-brand-500/10",
    },
    {
      label: "Unpaid",
      value: formatCurrency(summary.totals.totalUnpaid),
      subtitle: `${summary.received.count + summary.partiallyPaid.count} bills`,
      colorClass: "text-warning-500",
      bgClass: "bg-warning-50 dark:bg-warning-500/10",
    },
    {
      label: "Overdue",
      value: formatCurrency(summary.overdue.amount ?? 0),
      subtitle: `${summary.overdue.count} bills`,
      colorClass: "text-error-500",
      bgClass: "bg-error-50 dark:bg-error-500/10",
    },
    {
      label: "Paid",
      value: formatCurrency(summary.paid.amount ?? 0),
      subtitle: `${summary.paid.count} bills`,
      colorClass: "text-success-500",
      bgClass: "bg-success-50 dark:bg-success-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] ${card.bgClass}`}
        >
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {card.label}
          </p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${card.colorClass}`}>
            {card.value}
          </p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            {card.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
};

export default BillSummaryCards;
