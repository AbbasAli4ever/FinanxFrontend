"use client";

import React, { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import type {
  TemplatesResponse,
  AnyUpcomingItem,
  RecurringType,
} from "@/types/recurring";
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

// ── Type labels + colors ──────────────────────────────────────
const TYPE_META: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
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

const DOC_STATUS_BADGE: Record<string, "primary" | "success" | "error" | "warning" | "info" | "light" | "dark"> = {
  DRAFT: "light",
  SENT: "info",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  OVERDUE: "error",
  VOID: "dark",
  POSTED: "success",
  RECEIVED: "info",
  APPROVED: "success",
};

// ── Extract document number from any item ─────────────────────
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

// ── Flatten templates → unified list ─────────────────────────
function flattenTemplates(data: TemplatesResponse): (AnyUpcomingItem & { status: string })[] {
  const invoices = (data.invoices ?? []).map((i) => ({ ...i, type: "invoice" as const }));
  const bills = (data.bills ?? []).map((i) => ({ ...i, type: "bill" as const }));
  const expenses = (data.expenses ?? []).map((i) => ({ ...i, type: "expense" as const }));
  const journals = (data.journalEntries ?? []).map((i) => ({ ...i, type: "journal-entry" as const }));
  return [...invoices, ...bills, ...expenses, ...journals] as (AnyUpcomingItem & { status: string })[];
}

// ── Skeleton ──────────────────────────────────────────────────
const Skeleton: React.FC = () => (
  <div className="animate-pulse divide-y divide-gray-100 dark:divide-gray-800">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-5 py-4">
        <div className="h-5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-5 flex-1 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-5 w-24 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-5 w-28 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    ))}
  </div>
);

// ── Props ─────────────────────────────────────────────────────
interface TemplatesTableProps {
  data: TemplatesResponse | null;
  loading: boolean;
  filterType: string;
  onPause: (item: AnyUpcomingItem) => void;
  onResume: (item: AnyUpcomingItem) => void;
  onEditSettings: (item: AnyUpcomingItem) => void;
}

const TemplatesTable: React.FC<TemplatesTableProps> = ({
  data,
  loading,
  filterType,
  onPause,
  onResume,
  onEditSettings,
}) => {
  const [search, setSearch] = useState("");

  if (loading) return <Skeleton />;
  if (!data) return null;

  let items = flattenTemplates(data);

  // type filter
  if (filterType !== "all") {
    items = items.filter((item) => item.type === filterType);
  }

  // search filter
  if (search.trim()) {
    const q = search.toLowerCase();
    items = items.filter(
      (item) =>
        getDocNumber(item).toLowerCase().includes(q) ||
        getPartyName(item).toLowerCase().includes(q)
    );
  }

  // sort by next recurring date (nulls last)
  items.sort((a, b) => {
    if (!a.nextRecurringDate) return 1;
    if (!b.nextRecurringDate) return -1;
    return new Date(a.nextRecurringDate).getTime() - new Date(b.nextRecurringDate).getTime();
  });

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex items-center gap-2 px-1">
        <div className="relative flex-1 max-w-xs">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
          />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {items.length} template{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center dark:border-gray-700">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No recurring templates</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Create invoices, bills, or expenses with recurring enabled to see them here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Document</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Party</th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Amount</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Frequency</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Next Date</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item) => {
                const meta = TYPE_META[item.type];
                const statusRaw = (item as AnyUpcomingItem & { status?: string }).status ?? "";
                const badgeColor = DOC_STATUS_BADGE[statusRaw] ?? "light";
                const nextDate = item.nextRecurringDate;
                const days = nextDate ? daysUntil(nextDate) : null;
                const isOverdue = days !== null && days < 0;
                const isToday = days === 0;
                const isSoon = days !== null && days >= 0 && days <= 7;

                return (
                  <tr key={`${item.type}-${item.id}`} className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    {/* Type badge */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.bg} ${meta.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                    {/* Document # */}
                    <td className="px-3 py-3.5">
                      <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                        {getDocNumber(item)}
                      </span>
                    </td>
                    {/* Party */}
                    <td className="px-3 py-3.5 max-w-[140px]">
                      <span className="block truncate text-sm text-gray-700 dark:text-gray-300">
                        {getPartyName(item)}
                      </span>
                    </td>
                    {/* Amount */}
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                        {formatCurrency(getAmount(item))}
                      </span>
                    </td>
                    {/* Frequency */}
                    <td className="px-3 py-3.5 text-center">
                      <RecurringBadge
                        frequency={item.recurringFrequency}
                        isActive
                        showLabel
                        size="sm"
                      />
                    </td>
                    {/* Next Date */}
                    <td className="px-3 py-3.5 text-center">
                      {nextDate ? (
                        <div>
                          <p className={`text-xs font-semibold ${isOverdue ? "text-error-600 dark:text-error-400" : isToday ? "text-brand-600 dark:text-brand-400" : isSoon ? "text-warning-600 dark:text-warning-400" : "text-gray-700 dark:text-gray-300"}`}>
                            {formatDate(nextDate)}
                          </p>
                          <p className={`mt-0.5 text-[10px] ${isOverdue ? "text-error-500" : isToday ? "text-brand-500" : isSoon ? "text-warning-500" : "text-gray-400 dark:text-gray-500"}`}>
                            {isOverdue
                              ? `${Math.abs(days!)}d overdue`
                              : isToday
                              ? "Today"
                              : `In ${days}d`}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">Not scheduled</span>
                      )}
                    </td>
                    {/* Doc Status */}
                    <td className="px-3 py-3.5 text-center">
                      {statusRaw ? (
                        <Badge color={badgeColor}>{statusRaw.replace(/_/g, " ")}</Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        {/* Edit settings */}
                        <button
                          onClick={() => onEditSettings(item)}
                          title="Edit Settings"
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-700 dark:hover:text-brand-400"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {/* Pause */}
                        <button
                          onClick={() => onPause(item)}
                          title="Pause recurring"
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-warning-50 hover:text-warning-600 dark:hover:bg-warning-900/20 dark:hover:text-warning-400"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TemplatesTable;
