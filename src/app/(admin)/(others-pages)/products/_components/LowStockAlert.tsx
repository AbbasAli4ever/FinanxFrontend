"use client";

import React from "react";
import type { LowStockItem } from "@/types/products";

interface LowStockAlertProps {
  items: LowStockItem[];
}

const LowStockAlert: React.FC<LowStockAlertProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
      <div className="mb-3 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-warning-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3 className="text-sm font-semibold text-warning-700 dark:text-warning-400">
          Low Stock Alerts ({items.length})
        </h3>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 dark:bg-gray-900/40"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white/90">
                  {item.name}
                </span>
                {item.sku && (
                  <span className="text-xs text-gray-400">({item.sku})</span>
                )}
              </div>
              {item.preferredVendor && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Reorder {item.reorderQuantity || "—"} from{" "}
                  {item.preferredVendor.displayName}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium tabular-nums text-warning-600 dark:text-warning-400">
                {item.quantityOnHand}/{item.reorderPoint}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Deficit: {item.deficit}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LowStockAlert;
