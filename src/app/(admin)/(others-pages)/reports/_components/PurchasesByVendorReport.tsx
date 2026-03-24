"use client";

import React, { useState, useCallback, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import AppDatePicker from "@/components/form/AppDatePicker";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import reportsService from "@/services/reportsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { PurchasesByVendorReport as PurchasesData, PurchasesVendor } from "@/types/reports";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function firstDayOfYear(): string {
  return `${new Date().getFullYear()}-01-01`;
}

type PresetKey = "MTD" | "QTD" | "YTD" | "CUSTOM";

function getPresetDates(preset: PresetKey): { startDate: string; endDate: string } {
  const now = new Date();
  const today = todayStr();
  switch (preset) {
    case "MTD":
      return { startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, endDate: today };
    case "QTD": {
      const qMonth = Math.floor(now.getMonth() / 3) * 3 + 1;
      return { startDate: `${now.getFullYear()}-${String(qMonth).padStart(2, "0")}-01`, endDate: today };
    }
    case "YTD":
      return { startDate: `${now.getFullYear()}-01-01`, endDate: today };
    default:
      return { startDate: firstDayOfYear(), endDate: today };
  }
}

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "MTD", label: "Month to Date" },
  { key: "QTD", label: "Quarter to Date" },
  { key: "YTD", label: "Year to Date" },
  { key: "CUSTOM", label: "Custom" },
];

type SortKey = "totalAmount" | "totalPaid" | "totalOutstanding" | "billCount";

// ── Mini bar chart ────────────────────────────────────────────
const BarChart: React.FC<{ vendors: PurchasesVendor[]; maxAmt: number }> = ({ vendors, maxAmt }) => {
  const top10 = vendors.slice(0, 10);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <h4 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Top Vendors by Spend</h4>
      <div className="space-y-3">
        {top10.map((v) => {
          const pctTotal = maxAmt > 0 ? (v.totalAmount / maxAmt) * 100 : 0;
          const pctPaid = v.totalAmount > 0 ? (v.totalPaid / v.totalAmount) * 100 : 0;
          return (
            <div key={v.vendorId}>
              <div className="mb-1 flex items-center justify-between">
                <span className="max-w-[180px] truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                  {v.vendorName}
                </span>
                <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                  {formatCurrency(v.totalAmount)}
                </span>
              </div>
              <div className="relative h-5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-blue-400 dark:bg-blue-600 transition-all duration-500"
                  style={{ width: `${(pctTotal * pctPaid) / 100}%` }}
                />
                <div
                  className="absolute inset-y-0 rounded-full bg-orange-300 dark:bg-orange-700 transition-all duration-500"
                  style={{ left: `${(pctTotal * pctPaid) / 100}%`, width: `${pctTotal - (pctTotal * pctPaid) / 100}%` }}
                />
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400 dark:bg-blue-500" />
                  Paid {formatCurrency(v.totalPaid)}
                </span>
                {v.totalOutstanding > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-400" />
                    Outstanding {formatCurrency(v.totalOutstanding)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────
const Skeleton: React.FC = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-64 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          <div className="h-5 flex-1 rounded bg-gray-100 dark:bg-gray-800" />
          {[...Array(4)].map((__, j) => (
            <div key={j} className="h-5 w-24 rounded bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────
const PurchasesByVendorReport: React.FC = () => {
  const { token } = useAuth();
  const [preset, setPreset] = useState<PresetKey>("YTD");
  const [startDate, setStartDate] = useState(firstDayOfYear());
  const [endDate, setEndDate] = useState(todayStr());
  const [data, setData] = useState<PurchasesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalAmount");
  const [sortAsc, setSortAsc] = useState(false);

  const handlePresetChange = (key: PresetKey) => {
    setPreset(key);
    if (key !== "CUSTOM") {
      const dates = getPresetDates(key);
      setStartDate(dates.startDate);
      setEndDate(dates.endDate);
    }
  };

  const fetchReport = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await reportsService.getPurchasesByVendor(
        { startDate: startDate || undefined, endDate: endDate || undefined },
        token
      );
      setData(result);
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sortedVendors = data
    ? [...data.vendors].sort((a, b) => {
        const diff = a[sortKey] - b[sortKey];
        return sortAsc ? diff : -diff;
      })
    : [];

  const maxAmt = data ? Math.max(...data.vendors.map((v) => v.totalAmount), 1) : 1;

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["Vendor", "Bills", "Total Amount", "Paid", "Outstanding"],
      ...sortedVendors.map((v) => [v.vendorName, v.billCount, v.totalAmount, v.totalPaid, v.totalOutstanding]),
      ["TOTAL", data.totals.billCount, data.totals.totalAmount, data.totals.totalPaid, data.totals.totalOutstanding],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `purchases-by-vendor-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className={`ml-1 inline-block transition-opacity ${sortKey === col ? "opacity-100" : "opacity-30"}`}>
      {sortKey === col ? (sortAsc ? "↑" : "↓") : "↕"}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-end">
        <div>
          <Label>Period</Label>
          <select
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value as PresetKey)}
            className="h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            {PRESETS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-44">
          <Label>Start Date</Label>
          <AppDatePicker value={startDate} onChange={(val) => { setStartDate(val); setPreset("CUSTOM"); }} maxToday max={endDate} />
        </div>
        <div className="w-full sm:w-44">
          <Label>End Date</Label>
          <AppDatePicker value={endDate} onChange={(val) => { setEndDate(val); setPreset("CUSTOM"); }} min={startDate} maxToday />
        </div>
        <Button size="sm" onClick={fetchReport} disabled={loading}>
          {loading ? "Loading..." : "Generate"}
        </Button>
        {data && (
          <Button size="sm" variant="outline" onClick={exportCsv}>Export CSV</Button>
        )}
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {loading ? (
        <Skeleton />
      ) : data ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Spend", value: formatCurrency(data.totals.totalAmount), color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-900/20" },
              { label: "Total Paid", value: formatCurrency(data.totals.totalPaid), color: "text-success-700 dark:text-success-300", bg: "bg-success-50 dark:bg-success-900/20" },
              { label: "Outstanding", value: formatCurrency(data.totals.totalOutstanding), color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-900/20" },
              { label: "Total Bills", value: data.totals.billCount.toString(), color: "text-gray-900 dark:text-white", bg: "bg-gray-50 dark:bg-gray-800/40" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl border border-transparent p-4 ${stat.bg}`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className={`mt-1 text-xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Bar Chart */}
          {data.vendors.length > 0 && <BarChart vendors={data.vendors} maxAmt={maxAmt} />}

          {/* Table */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 p-5 dark:border-gray-800">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Purchases by Vendor</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {data.vendors.length} vendor{data.vendors.length !== 1 ? "s" : ""} · sorted by{" "}
                {sortKey === "totalAmount" ? "spend" : sortKey === "totalPaid" ? "paid" : sortKey === "totalOutstanding" ? "outstanding" : "bills"}
              </p>
            </div>
            {data.vendors.length === 0 ? (
              <div className="p-8 text-center text-sm italic text-gray-400 dark:text-gray-500">
                No purchase data found for this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Vendor
                      </th>
                      <th
                        onClick={() => handleSort("billCount")}
                        className="cursor-pointer px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        Bills <SortIcon col="billCount" />
                      </th>
                      <th
                        onClick={() => handleSort("totalAmount")}
                        className="cursor-pointer px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        Total Amount <SortIcon col="totalAmount" />
                      </th>
                      <th
                        onClick={() => handleSort("totalPaid")}
                        className="cursor-pointer px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        Paid <SortIcon col="totalPaid" />
                      </th>
                      <th
                        onClick={() => handleSort("totalOutstanding")}
                        className="cursor-pointer px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        Outstanding <SortIcon col="totalOutstanding" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {sortedVendors.map((v) => {
                      const paymentRate = v.totalAmount > 0 ? Math.round((v.totalPaid / v.totalAmount) * 100) : 0;
                      return (
                        <tr key={v.vendorId} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{v.vendorName}</p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <div className="h-1 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                  className="h-full rounded-full bg-blue-400 dark:bg-blue-500"
                                  style={{ width: `${paymentRate}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">{paymentRate}% paid</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right text-sm tabular-nums text-gray-600 dark:text-gray-400">
                            {v.billCount}
                          </td>
                          <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                            {formatCurrency(v.totalAmount)}
                          </td>
                          <td className="px-3 py-3 text-right text-sm tabular-nums text-blue-700 dark:text-blue-400">
                            {formatCurrency(v.totalPaid)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {v.totalOutstanding > 0 ? (
                              <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-sm font-semibold tabular-nums text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                                {formatCurrency(v.totalOutstanding)}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800/60">
                      <td className="px-5 py-3 text-sm font-bold uppercase text-gray-700 dark:text-gray-300">Total</td>
                      <td className="px-3 py-3 text-right text-sm font-bold tabular-nums text-gray-700 dark:text-gray-300">
                        {data.totals.billCount}
                      </td>
                      <td className="px-3 py-3 text-right text-base font-bold tabular-nums text-gray-900 dark:text-white">
                        {formatCurrency(data.totals.totalAmount)}
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-bold tabular-nums text-blue-700 dark:text-blue-400">
                        {formatCurrency(data.totals.totalPaid)}
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-bold tabular-nums text-orange-700 dark:text-orange-400">
                        {data.totals.totalOutstanding > 0 ? formatCurrency(data.totals.totalOutstanding) : "—"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default PurchasesByVendorReport;
