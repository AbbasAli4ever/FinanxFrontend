"use client";

import React from "react";
import type { JournalEntrySummary } from "@/types/journalEntries";

interface JournalEntrySummaryCardsProps {
  summary: JournalEntrySummary | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const JournalEntrySummaryCards: React.FC<JournalEntrySummaryCardsProps> = ({
  summary,
}) => {
  if (!summary) return null;

  const cards = [
    {
      label: "Draft",
      value: summary.draft.count.toString(),
      sub: "pending post",
      bg: "bg-gray-50 dark:bg-gray-800/40",
      text: "text-gray-600 dark:text-gray-300",
      accent: "text-gray-900 dark:text-white",
    },
    {
      label: "Posted",
      value: formatCurrency(summary.posted.totalDebit),
      sub: `${summary.posted.count} ${summary.posted.count === 1 ? "entry" : "entries"}`,
      bg: "bg-success-50 dark:bg-success-900/20",
      text: "text-success-600 dark:text-success-300",
      accent: "text-success-700 dark:text-success-200",
    },
    {
      label: "Voided",
      value: summary.voided.count.toString(),
      sub: "entries",
      bg: "bg-gray-50 dark:bg-gray-800/40",
      text: "text-gray-500 dark:text-gray-400",
      accent: "text-gray-700 dark:text-gray-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

export default JournalEntrySummaryCards;
