"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import AppDatePicker from "@/components/form/AppDatePicker";
import { useAuth } from "@/context/AuthContext";
import inventoryService from "@/services/inventoryService";
import type { InventoryMovement, MovementsFilters, TransactionType, StockSummaryItem } from "@/types/inventory";

interface Props {
  products: StockSummaryItem[];
}

const TRANSACTION_TYPE_OPTIONS: { label: string; value: TransactionType | "" }[] = [
  { label: "All Types", value: "" },
  { label: "Purchase Receive", value: "PURCHASE_RECEIVE" },
  { label: "Sales Fulfill", value: "SALES_FULFILL" },
  { label: "Manual Adjustment", value: "MANUAL_ADJUSTMENT" },
  { label: "Initial Stock", value: "INITIAL_STOCK" },
  { label: "Void Reversal", value: "VOID_REVERSAL" },
  { label: "Transfer", value: "TRANSFER" },
];

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.cls}`}>
      {c.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        </td>
      ))}
    </tr>
  );
}

const PAGE_SIZE = 20;

const MovementHistoryTable: React.FC<Props> = ({ products }) => {
  const { token } = useAuth();
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [transactionType, setTransactionType] = useState<TransactionType | "">("");
  const [productId, setProductId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchMovements = useCallback((pg = 1) => {
    if (!token) return;
    setLoading(true);

    const filters: MovementsFilters = {
      page: String(pg),
      limit: String(PAGE_SIZE),
      sortBy: "date",
      sortOrder: "desc",
    };
    if (transactionType) filters.transactionType = transactionType;
    if (productId) filters.productId = productId;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (search) filters.search = search;

    inventoryService
      .getMovements(filters, token)
      .then((data) => {
        setMovements(data.items ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotalCount(data.pagination?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, transactionType, productId, dateFrom, dateTo, search]);

  useEffect(() => {
    setPage(1);
    fetchMovements(1);
  }, [fetchMovements]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { setPage(1); }, 400);
  };

  const handlePageChange = (pg: number) => { setPage(pg); fetchMovements(pg); };

  const clearFilters = () => {
    setSearch("");
    setTransactionType("");
    setProductId("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasFilters = !!(search || transactionType || productId || dateFrom || dateTo);

  const getReferenceLink = (movement: InventoryMovement): string | null => {
    if (!movement.referenceId) return null;
    const map: Record<string, string> = {
      PURCHASE_ORDER: `/purchase-orders`,
      SALES_ORDER: `/sales-orders`,
      INVOICE: `/invoices`,
      BILL: `/bills`,
    };
    return map[movement.referenceType] ? `${map[movement.referenceType]}` : null;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search product, SKU, notes..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          {/* Transaction Type */}
          <select
            value={transactionType}
            onChange={(e) => { setTransactionType(e.target.value as TransactionType | ""); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {TRANSACTION_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Product filter */}
          <select
            value={productId}
            onChange={(e) => { setProductId(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>
            ))}
          </select>

          {/* Date From */}
          <AppDatePicker
            value={dateFrom}
            onChange={(val) => { setDateFrom(val); setPage(1); }}
            maxToday
            max={dateTo}
          />

          {/* Date To */}
          <div className="flex gap-2">
            <AppDatePicker
              value={dateTo}
              onChange={(val) => { setDateTo(val); setPage(1); }}
              min={dateFrom}
              maxToday
            />
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex-shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
                title="Clear filters"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                {["Date", "Product", "Type", "Qty Change", "Before → After", "Unit Cost", "Created By"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : movements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-700">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
          <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">No movements found</p>
          <p className="mt-1 text-xs text-gray-400">Try adjusting your date range or filters</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Qty Change</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Before → After</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Created By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {movements.map((m) => {
                  const isPositive = m.quantity > 0;
                  const refLink = getReferenceLink(m);
                  return (
                    <tr key={m.id} className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(m.date)}</p>
                        <p className="text-[11px] text-gray-400">{formatDateTime(m.date).split(",")[1]?.trim()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{m.product.name}</p>
                        {m.product.sku && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            {m.product.sku}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <TransactionTypeBadge type={m.transactionType} />
                        {m.notes && (
                          <p className="mt-0.5 max-w-[180px] truncate text-[11px] text-gray-400" title={m.notes}>
                            {m.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-bold tabular-nums ${
                          isPositive
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          {isPositive ? "+" : ""}{m.quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                          {m.quantityBefore.toLocaleString()}
                          <span className="mx-1 text-gray-300 dark:text-gray-600">→</span>
                          <span className={`font-semibold ${
                            m.quantityAfter <= 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-gray-700 dark:text-gray-300"
                          }`}>
                            {m.quantityAfter.toLocaleString()}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-semibold tabular-nums ${
                          m.totalCost < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-900 dark:text-white"
                        }`}>
                          {formatCurrency(Math.abs(m.totalCost))}
                        </span>
                        <p className="text-[11px] text-gray-400">
                          @ {formatCurrency(m.unitCost)}/unit
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {m.referenceId && refLink ? (
                          <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                            {m.referenceType.replace(/_/g, " ")}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {m.referenceType === "MANUAL" ? "Manual" : m.referenceType.replace(/_/g, " ")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {m.createdBy.firstName} {m.createdBy.lastName}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {totalCount} total movements
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pg = i + Math.max(1, page - 3);
              if (pg > totalPages) return null;
              return (
                <button
                  key={pg}
                  onClick={() => handlePageChange(pg)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    pg === page
                      ? "bg-brand-600 text-white"
                      : "border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovementHistoryTable;
