"use client";

import React from "react";
import type { StockSummaryData } from "@/types/inventory";

interface Props {
  stockData: StockSummaryData | null;
  valuationTotal: number;
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
        <div className="h-9 w-9 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mb-1 h-7 w-28 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

const InventorySummaryCards: React.FC<Props> = ({ stockData, valuationTotal, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const summary = stockData?.summary;

  const cards = [
    {
      label: "Total Value",
      value: formatCurrency(valuationTotal),
      sub: `${summary?.totalProducts ?? 0} tracked products`,
      iconBg: "bg-brand-50 dark:bg-brand-900/20",
      iconColor: "text-brand-600 dark:text-brand-400",
      badge: null,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
    },
    {
      label: "In Stock",
      value: String(summary?.inStockCount ?? 0),
      sub: "Products available",
      iconBg: "bg-green-50 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
      badge: null,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Low Stock",
      value: String(summary?.lowStockCount ?? 0),
      sub: "Need reorder",
      isWarning: (summary?.lowStockCount ?? 0) > 0,
      iconBg: "bg-amber-50 dark:bg-amber-900/20",
      iconColor: "text-amber-600 dark:text-amber-400",
      badge: (summary?.lowStockCount ?? 0) > 0
        ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">ALERT</span>
        : null,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
    },
    {
      label: "Out of Stock",
      value: String(summary?.outOfStockCount ?? 0),
      sub: "Qty = 0",
      isError: (summary?.outOfStockCount ?? 0) > 0,
      iconBg: "bg-red-50 dark:bg-red-900/20",
      iconColor: "text-red-600 dark:text-red-400",
      badge: (summary?.outOfStockCount ?? 0) > 0
        ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">CRITICAL</span>
        : null,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border p-5 transition-shadow hover:shadow-sm ${
            card.isError
              ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10"
              : card.isWarning
              ? "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10"
              : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}>
              {card.icon}
            </div>
            {card.badge}
          </div>
          <p className={`mb-0.5 text-2xl font-bold tabular-nums ${
            card.isError
              ? "text-red-700 dark:text-red-300"
              : card.isWarning
              ? "text-amber-700 dark:text-amber-300"
              : "text-gray-900 dark:text-white"
          }`}>
            {card.value}
          </p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{card.label}</p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{card.sub}</p>
        </div>
      ))}
    </div>
  );
};

export default InventorySummaryCards;
