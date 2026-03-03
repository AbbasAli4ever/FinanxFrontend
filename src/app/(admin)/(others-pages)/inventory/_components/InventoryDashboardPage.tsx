"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import inventoryService from "@/services/inventoryService";
import type {
  StockSummaryData,
  InventoryValuationResponse,
  StockSummaryItem,
} from "@/types/inventory";

import InventorySummaryCards from "./InventorySummaryCards";
import StockSummaryTable from "./StockSummaryTable";
import MovementHistoryTable from "./MovementHistoryTable";
import StockCardModal from "./StockCardModal";

type ActiveTab = "stock" | "movements" | "valuation";

const TABS: { label: string; value: ActiveTab; icon: React.ReactNode }[] = [
  {
    label: "Stock Summary",
    value: "stock",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    label: "Movement History",
    value: "movements",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    label: "Valuation",
    value: "valuation",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
];

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function SkeletonValuationRow() {
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

const InventoryDashboardPage: React.FC = () => {
  const { token } = useAuth();

  const [stockData, setStockData] = useState<StockSummaryData | null>(null);
  const [valuation, setValuation] = useState<InventoryValuationResponse | null>(null);
  const [stockLoading, setStockLoading] = useState(true);
  const [valuationLoading, setValuationLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>("stock");

  // Stock card modal
  const [stockCardProduct, setStockCardProduct] = useState<StockSummaryItem | null>(null);

  const fetchStockSummary = useCallback(() => {
    if (!token) return;
    setStockLoading(true);
    inventoryService
      .getStockSummary(token)
      .then(setStockData)
      .catch(() => {})
      .finally(() => setStockLoading(false));
  }, [token]);

  const fetchValuation = useCallback(() => {
    if (!token) return;
    setValuationLoading(true);
    inventoryService
      .getValuation(token)
      .then(setValuation)
      .catch(() => {})
      .finally(() => setValuationLoading(false));
  }, [token]);

  useEffect(() => {
    fetchStockSummary();
    fetchValuation();
  }, [fetchStockSummary, fetchValuation]);

  const products: StockSummaryItem[] = stockData?.items ?? [];
  const totalValue = valuation?.summary?.totalValue ?? stockData?.summary?.totalValue ?? 0;

  const lowStockProducts = products.filter((p) => p.status === "LOW_STOCK");
  const outOfStockProducts = products.filter((p) => p.status === "OUT_OF_STOCK");
  const hasAlerts = lowStockProducts.length > 0 || outOfStockProducts.length > 0;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          {hasAlerts && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {lowStockProducts.length + outOfStockProducts.length} Alert{lowStockProducts.length + outOfStockProducts.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Track stock levels, monitor movements, and manage inventory valuation
        </p>
      </div>

      {/* Summary Cards */}
      <InventorySummaryCards
        stockData={stockData}
        valuationTotal={totalValue}
        loading={stockLoading}
      />

      {/* Alerts Banner */}
      {!stockLoading && hasAlerts && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/10">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Inventory Alerts</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {outOfStockProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setActiveTab("stock"); setStockCardProduct(p); }}
                    className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                  >
                    {p.name} — OUT OF STOCK
                  </button>
                ))}
                {lowStockProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setActiveTab("stock"); setStockCardProduct(p); }}
                    className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
                  >
                    {p.name} — Low ({p.quantityOnHand} remaining, reorder at {p.reorderPoint})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.value === "stock" && !stockLoading && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === tab.value
                    ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}>
                  {products.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "stock" && (
        <StockSummaryTable
          items={products}
          loading={stockLoading}
          onViewStockCard={(item) => setStockCardProduct(item)}
        />
      )}

      {activeTab === "movements" && (
        <MovementHistoryTable products={products} />
      )}

      {activeTab === "valuation" && (
        <div className="flex flex-col gap-4">
          {/* Valuation Summary */}
          {!valuationLoading && valuation && (
            <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-5 py-4 dark:border-brand-800 dark:bg-brand-900/10">
              <div>
                <p className="text-sm font-medium text-brand-700 dark:text-brand-300">Total Inventory Value</p>
                <p className="text-3xl font-bold tabular-nums text-brand-800 dark:text-brand-200">
                  {formatCurrency(valuation.summary.totalValue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-brand-600 dark:text-brand-400">{valuation.summary.totalProducts} tracked products</p>
                <p className="text-xs text-brand-500 dark:text-brand-500">Based on average cost × quantity</p>
              </div>
            </div>
          )}

          {/* Valuation Table */}
          {valuationLoading ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                    {["Product", "SKU", "Category", "Qty on Hand", "Avg Cost", "Sales Price", "Total Value"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonValuationRow key={i} />)}
                </tbody>
              </table>
            </div>
          ) : !valuation?.items?.length ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-700">
              <p className="text-sm text-gray-500">No inventory data available</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Category</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Qty on Hand</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Avg Cost</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Sales Price</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {[...valuation.items]
                      .sort((a, b) => b.totalValue - a.totalValue)
                      .map((item, idx) => {
                        const pct = valuation.summary.totalValue > 0
                          ? (item.totalValue / valuation.summary.totalValue) * 100
                          : 0;
                        return (
                          <tr key={item.id} className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                  {idx + 1}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {item.sku ? (
                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                  {item.sku}
                                </span>
                              ) : <span className="text-gray-400">—</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {item.category?.name ?? <span className="text-gray-400">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-900 dark:text-white">
                              {item.quantityOnHand.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                              {formatCurrency(item.averageCost)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                              {formatCurrency(item.salesPrice)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="hidden w-24 sm:block">
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                    <div
                                      className="h-full rounded-full bg-brand-500 dark:bg-brand-400"
                                      style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                  </div>
                                  <p className="mt-0.5 text-right text-[10px] text-gray-400">{pct.toFixed(1)}%</p>
                                </div>
                                <span className="font-bold tabular-nums text-gray-900 dark:text-white">
                                  {formatCurrency(item.totalValue)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                      <td colSpan={6} className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Total Inventory Value
                      </td>
                      <td className="px-4 py-3 text-right text-base font-bold tabular-nums text-brand-600 dark:text-brand-400">
                        {formatCurrency(valuation.summary.totalValue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock Card Modal */}
      <StockCardModal
        isOpen={!!stockCardProduct}
        product={stockCardProduct}
        onClose={() => setStockCardProduct(null)}
      />
    </div>
  );
};

export default InventoryDashboardPage;
