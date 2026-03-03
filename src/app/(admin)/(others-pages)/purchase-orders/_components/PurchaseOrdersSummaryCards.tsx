"use client";

import React from "react";
import type { POSummary } from "@/types/purchaseOrders";

interface Props {
  summary: POSummary | null;
  loading?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mb-1 h-7 w-24 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

const PurchaseOrdersSummaryCards: React.FC<Props> = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const draft = summary?.draft.count ?? 0;
  const sentCount = summary?.sent.count ?? 0;
  const partialCount = summary?.partial.count ?? 0;
  const inProgressCount = sentCount + partialCount;
  const totalPending = summary?.totals.totalPending ?? 0;
  const receivedCount = summary?.received.count ?? 0;
  const receivedAmount = summary?.received.amount ?? 0;
  const closedCount = summary?.closed.count ?? 0;
  const closedAmount = summary?.closed.amount ?? 0;
  const overdueCount = summary?.overdueDelivery.count ?? 0;
  const overdueAmount = summary?.overdueDelivery.amount ?? 0;

  const cards = [
    {
      label: "Draft",
      count: draft,
      sub: `${draft} order${draft !== 1 ? "s" : ""}`,
      color: "gray",
      iconBg: "bg-gray-100 dark:bg-gray-800",
      iconColor: "text-gray-500 dark:text-gray-400",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      label: "In Progress",
      count: inProgressCount,
      amount: totalPending,
      sub: formatCurrency(totalPending) + " pending",
      color: "blue",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Received",
      count: receivedCount,
      amount: receivedAmount,
      sub: formatCurrency(receivedAmount),
      color: "green",
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Closed",
      count: closedCount,
      amount: closedAmount,
      sub: formatCurrency(closedAmount),
      color: "emerald",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
    },
    {
      label: "Overdue",
      count: overdueCount,
      amount: overdueAmount,
      sub: overdueCount > 0 ? formatCurrency(overdueAmount) + " at risk" : "All on time",
      color: "amber",
      isOverdue: true,
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
    },
    {
      label: "Pending Value",
      count: null,
      currencyDisplay: formatCurrency(totalPending),
      sub: `${inProgressCount} order${inProgressCount !== 1 ? "s" : ""} in progress`,
      color: "brand",
      iconBg: "bg-brand-100 dark:bg-brand-900/30",
      iconColor: "text-brand-600 dark:text-brand-400",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border p-5 transition-shadow hover:shadow-sm ${
            card.isOverdue && overdueCount > 0
              ? "border-amber-200 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-900/10"
              : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconBg} ${card.iconColor}`}>
              {card.icon}
            </div>
            {card.count !== null && (
              <span className={`text-xs font-medium ${
                card.isOverdue && overdueCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-400 dark:text-gray-500"
              }`}>
                {card.count} PO{card.count !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {card.currencyDisplay ? (
            <p className="mb-0.5 text-xl font-bold tabular-nums text-gray-900 dark:text-white">{card.currencyDisplay}</p>
          ) : (
            <p className={`mb-0.5 text-2xl font-bold tabular-nums ${
              card.isOverdue && overdueCount > 0 ? "text-amber-700 dark:text-amber-300" : "text-gray-900 dark:text-white"
            }`}>{card.count}</p>
          )}
          <p className={`text-xs font-medium ${
            card.isOverdue && overdueCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"
          }`}>{card.label}</p>
          <p className={`mt-0.5 text-xs ${
            card.isOverdue && overdueCount > 0 ? "text-amber-500 dark:text-amber-500" : "text-gray-400 dark:text-gray-500"
          }`}>{card.sub}</p>
        </div>
      ))}
    </div>
  );
};

export default PurchaseOrdersSummaryCards;
