"use client";

import React, { useState } from "react";
import type { UpcomingResponse, AnyUpcomingItem } from "@/types/recurring";
import RecurringBadge, { FREQ_LABELS } from "./RecurringBadge";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// ── Type meta ─────────────────────────────────────────────────
const TYPE_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  invoice: {
    label: "Invoice",
    color: "text-brand-700 dark:text-brand-300",
    bg: "bg-brand-50 dark:bg-brand-900/20",
    dot: "bg-brand-500",
  },
  bill: {
    label: "Bill",
    color: "text-orange-700 dark:text-orange-300",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    dot: "bg-orange-500",
  },
  expense: {
    label: "Expense",
    color: "text-purple-700 dark:text-purple-300",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    dot: "bg-purple-500",
  },
  "journal-entry": {
    label: "Journal",
    color: "text-teal-700 dark:text-teal-300",
    bg: "bg-teal-50 dark:bg-teal-900/20",
    dot: "bg-teal-500",
  },
};

function getDocNumber(item: AnyUpcomingItem): string {
  switch (item.type) {
    case "invoice": return item.invoiceNumber;
    case "bill": return item.billNumber;
    case "expense": return item.expenseNumber;
    case "journal-entry": return item.entryNumber;
  }
}

function getAmount(item: AnyUpcomingItem): number {
  if (item.type === "journal-entry") return item.totalDebit;
  return item.totalAmount;
}

function getPartyName(item: AnyUpcomingItem): string {
  switch (item.type) {
    case "invoice": return item.customer.displayName;
    case "bill": return item.vendor.displayName;
    case "expense": return item.vendor?.displayName ?? "—";
    case "journal-entry": return item.description ?? "—";
  }
}

function flattenUpcoming(data: UpcomingResponse): AnyUpcomingItem[] {
  const invoices = (data.invoices ?? []).map((i) => ({ ...i, type: "invoice" as const }));
  const bills = (data.bills ?? []).map((i) => ({ ...i, type: "bill" as const }));
  const expenses = (data.expenses ?? []).map((i) => ({ ...i, type: "expense" as const }));
  const journals = (data.journalEntries ?? []).map((i) => ({ ...i, type: "journal-entry" as const }));
  return [...invoices, ...bills, ...expenses, ...journals];
}

// ── Timeline tick ─────────────────────────────────────────────
const TimelineTick: React.FC<{ days: number }> = ({ days }) => {
  const isOverdue = days < 0;
  const isToday = days === 0;
  const isSoon = days > 0 && days <= 3;
  const isThisWeek = days > 3 && days <= 7;

  const label = isOverdue
    ? `${Math.abs(days)}d overdue`
    : isToday
    ? "Today"
    : `${days}d`;

  const cls = isOverdue
    ? "bg-error-500 text-white"
    : isToday
    ? "bg-brand-500 text-white"
    : isSoon
    ? "bg-warning-400 text-white"
    : isThisWeek
    ? "bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200"
    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      {label}
    </span>
  );
};

// ── Skeleton ──────────────────────────────────────────────────
const Skeleton: React.FC = () => (
  <div className="animate-pulse divide-y divide-gray-100 dark:divide-gray-800">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-5 py-4">
        <div className="h-14 w-14 rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-3 w-28 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-5 w-24 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    ))}
  </div>
);

// ── Props ─────────────────────────────────────────────────────
interface UpcomingTableProps {
  data: UpcomingResponse | null;
  loading: boolean;
  daysAhead: number;
  filterType: string;
  onEditSettings: (item: AnyUpcomingItem) => void;
}

const UpcomingTable: React.FC<UpcomingTableProps> = ({
  data,
  loading,
  daysAhead,
  filterType,
  onEditSettings,
}) => {
  if (loading) return <Skeleton />;
  if (!data) return null;

  let items = flattenUpcoming(data);

  if (filterType !== "all") {
    items = items.filter((item) => item.type === filterType);
  }

  // sort chronologically
  items.sort(
    (a, b) =>
      new Date(a.nextRecurringDate).getTime() -
      new Date(b.nextRecurringDate).getTime()
  );

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center dark:border-gray-700">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-50 dark:bg-success-900/20">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-success-500">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">All caught up!</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          No recurring items due in the next {daysAhead} days.
        </p>
      </div>
    );
  }

  // Group by day
  const groups: Record<string, AnyUpcomingItem[]> = {};
  items.forEach((item) => {
    const d = item.nextRecurringDate.split("T")[0];
    if (!groups[d]) groups[d] = [];
    groups[d].push(item);
  });

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([dateKey, dayItems]) => {
        const days = daysUntil(dateKey + "T00:00:00");
        const isToday = dateKey === today;
        const isOverdue = days < 0;

        return (
          <div key={dateKey}>
            {/* Day group header */}
            <div className={`mb-2 flex items-center gap-2 ${isToday ? "text-brand-700 dark:text-brand-300" : isOverdue ? "text-error-600 dark:text-error-400" : "text-gray-500 dark:text-gray-400"}`}>
              <div className={`h-px flex-1 ${isToday ? "bg-brand-200 dark:bg-brand-800" : isOverdue ? "bg-error-200 dark:bg-error-800" : "bg-gray-200 dark:bg-gray-700"}`} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {isToday ? "Today" : new Date(dateKey + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </span>
              <TimelineTick days={days} />
              <div className={`h-px flex-1 ${isToday ? "bg-brand-200 dark:bg-brand-800" : isOverdue ? "bg-error-200 dark:bg-error-800" : "bg-gray-200 dark:bg-gray-700"}`} />
            </div>

            {/* Items for this day */}
            <div className="space-y-2">
              {dayItems.map((item) => {
                const meta = TYPE_META[item.type];
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={`group flex items-center gap-4 rounded-xl border bg-white px-4 py-3.5 transition-shadow hover:shadow-sm dark:bg-white/[0.03] ${isOverdue ? "border-error-100 dark:border-error-900/40" : isToday ? "border-brand-100 dark:border-brand-900/30" : "border-gray-200 dark:border-gray-700"}`}
                  >
                    {/* Type pill */}
                    <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl ${meta.bg}`}>
                      <span className={`text-[10px] font-bold uppercase ${meta.color}`}>
                        {meta.label.slice(0, 3)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                          {getDocNumber(item)}
                        </span>
                        <RecurringBadge
                          frequency={item.recurringFrequency}
                          isActive
                          showLabel={false}
                          size="sm"
                        />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        {getPartyName(item)}
                        {item.recurringEndDate && (
                          <span className="ml-2 text-[10px] text-gray-400 dark:text-gray-500">
                            ends {formatDate(item.recurringEndDate)}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                        {formatCurrency(getAmount(item))}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        {FREQ_LABELS[item.recurringFrequency] ?? item.recurringFrequency}
                      </p>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => onEditSettings(item)}
                      title="Edit settings"
                      className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-brand-600 group-hover:opacity-100 dark:hover:bg-gray-700 dark:hover:text-brand-400"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UpcomingTable;
