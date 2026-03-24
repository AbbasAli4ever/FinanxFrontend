"use client";

import React, { useCallback, useEffect, useState } from "react";
import AppDatePicker from "@/components/form/AppDatePicker";
import { useAuth } from "@/context/AuthContext";
import inventoryService from "@/services/inventoryService";
import type { ProductStockCard, StockSummaryItem, InventoryMovement, TransactionType } from "@/types/inventory";

interface Props {
  isOpen: boolean;
  product: StockSummaryItem | null;
  onClose: () => void;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function TransactionTypeBadge({ type }: { type: TransactionType }) {
  const config: Record<TransactionType, { label: string; cls: string }> = {
    PURCHASE_RECEIVE: { label: "Purchase Receive", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    SALES_FULFILL: { label: "Sales Fulfill", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    MANUAL_ADJUSTMENT: { label: "Manual Adj.", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    INITIAL_STOCK: { label: "Initial Stock", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
    VOID_REVERSAL: { label: "Void Reversal", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    TRANSFER: { label: "Transfer", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  };
  const c = config[type] ?? { label: type, cls: "bg-gray-100 text-gray-700" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${c.cls}`}>
      {c.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        </td>
      ))}
    </tr>
  );
}

const PAGE_SIZE = 50;

const StockCardModal: React.FC<Props> = ({ isOpen, product, onClose }) => {
  const { token } = useAuth();
  const [data, setData] = useState<ProductStockCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchStockCard = useCallback((pg = 1) => {
    if (!token || !product?.id) return;
    setLoading(true);
    inventoryService
      .getProductStockCard(product.id, {
        page: String(pg),
        limit: String(PAGE_SIZE),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
      }, token)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, product?.id, dateFrom, dateTo]);

  useEffect(() => {
    if (isOpen && product?.id) {
      setPage(1);
      setData(null);
      fetchStockCard(1);
    }
  }, [isOpen, product?.id, fetchStockCard]);

  const handlePageChange = (pg: number) => { setPage(pg); fetchStockCard(pg); };

  const handleFilterApply = () => { setPage(1); fetchStockCard(1); };

  const clearFilters = () => { setDateFrom(""); setDateTo(""); };

  if (!isOpen || !product) return null;

  const stockCard = data;
  const transactions: InventoryMovement[] = stockCard?.transactions ?? [];
  const totalPages = stockCard?.pagination?.totalPages ?? 1;
  const totalCount = stockCard?.pagination?.total ?? 0;
  const prod = stockCard?.product;

  const statusConfig = {
    IN_STOCK: { label: "In Stock", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", dot: "bg-green-500" },
    LOW_STOCK: { label: "Low Stock", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" },
    OUT_OF_STOCK: { label: "Out of Stock", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
  }[product.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 p-6 dark:border-gray-800">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">
                <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{product.name}</h2>
                <div className="mt-0.5 flex items-center gap-2">
                  {product.sku && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {product.sku}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.cls}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Product Stats */}
        {prod && (
          <div className="grid grid-cols-2 gap-3 border-b border-gray-200 p-4 dark:border-gray-800 sm:grid-cols-5">
            {[
              { label: "Current Qty", value: prod.currentQuantity.toLocaleString(), highlight: prod.currentQuantity <= 0 },
              { label: "Avg Cost", value: formatCurrency(prod.averageCost), highlight: false },
              { label: "Sales Price", value: formatCurrency(prod.salesPrice), highlight: false },
              { label: "Reorder Point", value: prod.reorderPoint.toLocaleString(), highlight: false },
              { label: "Reorder Qty", value: prod.reorderQuantity.toLocaleString(), highlight: false },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className={`mt-0.5 text-lg font-bold tabular-nums ${
                  stat.highlight ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"
                }`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Date filter */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
          <AppDatePicker
            value={dateFrom}
            onChange={(val) => setDateFrom(val)}
            maxToday
            max={dateTo}
          />
          <span className="text-gray-400">—</span>
          <AppDatePicker
            value={dateTo}
            onChange={(val) => setDateTo(val)}
            min={dateFrom}
            maxToday
          />
          <button
            onClick={handleFilterApply}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Apply
          </button>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { clearFilters(); setPage(1); fetchStockCard(1); }}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400">{totalCount} movement{totalCount !== 1 ? "s" : ""}</span>
        </div>

        {/* Transactions Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/60">
                  {["Date & Time", "Type", "Qty Change", "Balance", "Unit Cost", "Total Cost", "Reference", "By"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <svg className="h-12 w-12 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No transactions in this period</p>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Qty Change</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Before → After</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Unit Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Notes</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {transactions.map((tx) => {
                  const isPositive = tx.quantity > 0;
                  return (
                    <tr key={tx.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {formatDateTime(tx.date)}
                      </td>
                      <td className="px-4 py-3">
                        <TransactionTypeBadge type={tx.transactionType} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold tabular-nums ${
                          isPositive
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          {isPositive ? "+" : ""}{tx.quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs tabular-nums text-gray-500 dark:text-gray-400">
                        {tx.quantityBefore.toLocaleString()}
                        <span className="mx-1 text-gray-300 dark:text-gray-600">→</span>
                        <span className={`font-semibold ${
                          tx.quantityAfter <= 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-700 dark:text-gray-300"
                        }`}>
                          {tx.quantityAfter.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">
                        {formatCurrency(tx.unitCost)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold tabular-nums ${
                          tx.totalCost < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-900 dark:text-white"
                        }`}>
                          {tx.totalCost < 0 ? "-" : ""}{formatCurrency(Math.abs(tx.totalCost))}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        {tx.notes ? (
                          <span className="truncate text-xs text-gray-500 dark:text-gray-400" title={tx.notes}>
                            {tx.notes}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-700">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {tx.createdBy.firstName} {tx.createdBy.lastName}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-gray-200 p-4 dark:border-gray-800">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => handlePageChange(pg)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  pg === page
                    ? "bg-brand-600 text-white"
                    : "border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockCardModal;
