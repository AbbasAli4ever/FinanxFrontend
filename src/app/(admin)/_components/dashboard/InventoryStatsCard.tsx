"use client";

import React from "react";
import type { InventoryStats } from "@/types/dashboard";

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

interface Props {
  data: InventoryStats | null;
  loading?: boolean;
}

const InventoryStatsCard: React.FC<Props> = ({ data, loading }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <div className="mb-4 flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-900/20">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Inventory</h3>
    </div>

    {loading || !data ? (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    ) : (
      <>
        {/* Summary grid */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Products</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{data.summary.totalTrackedProducts}</p>
          </div>
          <div className="rounded-xl bg-sky-50/60 p-3 dark:bg-sky-900/20">
            <p className="text-[10px] uppercase tracking-wide text-sky-600 dark:text-sky-400">Value</p>
            <p className="text-xl font-bold text-sky-700 dark:text-sky-300">{fmt(data.summary.totalInventoryValue)}</p>
          </div>
          <div className="rounded-xl bg-warning-50/60 p-3 dark:bg-warning-900/20">
            <p className="text-[10px] uppercase tracking-wide text-warning-600 dark:text-warning-400">Low Stock</p>
            <p className="text-xl font-bold text-warning-700 dark:text-warning-300">{data.summary.lowStockCount}</p>
          </div>
          <div className="rounded-xl bg-error-50/60 p-3 dark:bg-error-900/20">
            <p className="text-[10px] uppercase tracking-wide text-error-600 dark:text-error-400">Out of Stock</p>
            <p className="text-xl font-bold text-error-700 dark:text-error-300">{data.summary.outOfStockCount}</p>
          </div>
        </div>

        {/* Low stock alerts */}
        {data.lowStockAlerts.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-warning-600 dark:text-warning-400">
              Low Stock Alerts
            </p>
            <div className="space-y-1.5">
              {data.lowStockAlerts.slice(0, 4).map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between rounded-lg border border-warning-100 bg-warning-50/40 px-3 py-2 dark:border-warning-800/30 dark:bg-warning-900/10"
                >
                  <div>
                    <p className="text-xs font-medium text-gray-800 dark:text-white">{item.name}</p>
                    <p className="text-[10px] text-gray-400">{item.sku} · {item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-warning-700 dark:text-warning-300">{item.quantityOnHand}</p>
                    <p className="text-[10px] text-gray-400">min {item.reorderPoint}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top sellers */}
        {data.topSellingProducts.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-success-600 dark:text-success-400">
              Top Sellers (90d)
            </p>
            <div className="space-y-1.5">
              {data.topSellingProducts.slice(0, 4).map((item, i) => (
                <div key={item.productId} className="flex items-center gap-2 text-xs">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success-100 text-[10px] font-bold text-success-700 dark:bg-success-900/30 dark:text-success-300">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-700 dark:text-gray-200">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{fmt(item.totalRevenue)}</p>
                    <p className="text-[10px] text-gray-400">{item.quantityFulfilled} units</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    )}
  </div>
);

export default InventoryStatsCard;
