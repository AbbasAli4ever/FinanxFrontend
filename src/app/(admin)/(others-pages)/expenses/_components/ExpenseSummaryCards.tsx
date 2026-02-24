"use client";

import React from "react";
import type { ExpenseSummary } from "@/types/expenses";

interface ExpenseSummaryCardsProps {
  summary: ExpenseSummary | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const ExpenseSummaryCards: React.FC<ExpenseSummaryCardsProps> = ({
  summary,
}) => {
  if (!summary) return null;

  const cards = [
    {
      label: "Draft",
      value: summary.draft.count.toString(),
      sub: "expenses",
      bg: "bg-gray-50 dark:bg-gray-800/40",
      text: "text-gray-600 dark:text-gray-300",
      accent: "text-gray-900 dark:text-white",
    },
    {
      label: "Pending Approval",
      value: formatCurrency(summary.pendingApproval.amount),
      sub: `${summary.pendingApproval.count} expense${summary.pendingApproval.count !== 1 ? "s" : ""}`,
      bg: "bg-warning-50 dark:bg-warning-900/20",
      text: "text-warning-600 dark:text-warning-300",
      accent: "text-warning-700 dark:text-warning-200",
    },
    {
      label: "Approved",
      value: formatCurrency(summary.approved.amount),
      sub: `${summary.approved.count} expense${summary.approved.count !== 1 ? "s" : ""}`,
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-600 dark:text-blue-300",
      accent: "text-blue-700 dark:text-blue-200",
    },
    {
      label: "Total Paid",
      value: formatCurrency(summary.paid.amount),
      sub: `${summary.paid.count} expense${summary.paid.count !== 1 ? "s" : ""}`,
      bg: "bg-success-50 dark:bg-success-900/20",
      text: "text-success-600 dark:text-success-300",
      accent: "text-success-700 dark:text-success-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border border-gray-200 p-5 shadow-sm dark:border-gray-800 ${card.bg}`}
        >
          <p className={`text-xs font-medium uppercase tracking-wider ${card.text}`}>
            {card.label}
          </p>
          <p className={`mt-2 text-2xl font-bold ${card.accent}`}>
            {card.value}
          </p>
          <p className={`mt-1 text-xs ${card.text}`}>{card.sub}</p>
        </div>
      ))}
    </div>
  );
};

export default ExpenseSummaryCards;
