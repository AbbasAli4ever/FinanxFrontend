"use client";

import React, { useState } from "react";
import type { StockSummaryItem, StockStatus } from "@/types/inventory";

interface Props {
  items: StockSummaryItem[];
  loading?: boolean;
  onViewStockCard: (item: StockSummaryItem) => void;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

type FilterStatus = StockStatus | "ALL";
type SortKey = "name" | "quantityOnHand" | "totalValue" | "averageCost" | "status";

const STATUS_FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "All", value: "ALL" },
  { label: "In Stock", value: "IN_STOCK" },
  { label: "Low Stock", value: "LOW_STOCK" },
  { label: "Out of Stock", value: "OUT_OF_STOCK" },
];

function StatusBadge({ status }: { status: StockStatus }) {
  const config = {
    IN_STOCK: {
      label: "In Stock",
      cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      dot: "bg-green-500",
    },
    LOW_STOCK: {
      label: "Low Stock",
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      dot: "bg-amber-500",
    },
    OUT_OF_STOCK: {
      label: "Out of Stock",
      cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      dot: "bg-red-500",
    },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        </td>
      ))}
    </tr>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  return (
    <svg className={`ml-1 inline h-3.5 w-3.5 ${active ? "text-brand-500" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      {active && dir === "asc" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      ) : active && dir === "desc" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
      )}
    </svg>
  );
}

const StockSummaryTable: React.FC<Props> = ({ items, loading, onViewStockCard }) => {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = (items ?? [])
    .filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          (item.sku ?? "").toLowerCase().includes(q) ||
          (item.category?.name ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;
      switch (sortKey) {
        case "name": valA = a.name; valB = b.name; break;
        case "quantityOnHand": valA = a.quantityOnHand; valB = b.quantityOnHand; break;
        case "totalValue": valA = a.totalValue; valB = b.totalValue; break;
        case "averageCost": valA = a.averageCost; valB = b.averageCost; break;
        case "status": valA = a.status; valB = b.status; break;
      }
      if (typeof valA === "string") {
        return sortDir === "asc" ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA);
      }
      return sortDir === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

  const TH = ({ label, sortable, sk }: { label: string; sortable?: boolean; sk?: SortKey }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 ${sortable ? "cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300" : ""}`}
      onClick={sortable && sk ? () => handleSort(sk) : undefined}
    >
      {label}
      {sortable && sk && <SortIcon active={sortKey === sk} dir={sortDir} />}
    </th>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-brand-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {f.label}
              {f.value !== "ALL" && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  statusFilter === f.value
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}>
                  {(items ?? []).filter((i) => i.status === f.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, SKU..."
            className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white sm:w-64"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                <TH label="Product" />
                <TH label="SKU" />
                <TH label="Category" />
                <TH label="Qty on Hand" />
                <TH label="Avg Cost" />
                <TH label="Total Value" />
                <TH label="Reorder Point" />
                <TH label="Status" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-700">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">No products found</p>
          <p className="mt-1 text-xs text-gray-400">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                  <TH label="Product" sortable sk="name" />
                  <TH label="SKU" />
                  <TH label="Category" />
                  <TH label="Qty on Hand" sortable sk="quantityOnHand" />
                  <TH label="Avg Cost" sortable sk="averageCost" />
                  <TH label="Total Value" sortable sk="totalValue" />
                  <TH label="Reorder Point" />
                  <TH label="Status" sortable sk="status" />
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className={`group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 ${
                      item.status === "OUT_OF_STOCK"
                        ? "bg-red-50/30 dark:bg-red-900/5"
                        : item.status === "LOW_STOCK"
                        ? "bg-amber-50/30 dark:bg-amber-900/5"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                        {item.preferredVendor && (
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">Vendor: {item.preferredVendor.displayName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.sku ? (
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          {item.sku}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {item.category?.name ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold tabular-nums ${
                        item.quantityOnHand <= 0
                          ? "text-red-600 dark:text-red-400"
                          : item.quantityOnHand <= item.reorderPoint
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-gray-900 dark:text-white"
                      }`}>
                        {item.quantityOnHand.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-700 dark:text-gray-300">
                      {formatCurrency(item.averageCost)}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-gray-900 dark:text-white">
                      {formatCurrency(item.totalValue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      <span>{item.reorderPoint}</span>
                      {item.status === "LOW_STOCK" && (
                        <span className="ml-1.5 text-[11px] text-amber-500">
                          (reorder {item.reorderQuantity})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewStockCard(item)}
                          className="rounded px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20"
                          title="View Stock Card"
                        >
                          Stock Card
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-right text-xs text-gray-400">
          Showing {filtered.length} of {items.length} products
        </p>
      )}
    </div>
  );
};

export default StockSummaryTable;
