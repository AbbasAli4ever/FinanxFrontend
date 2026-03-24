"use client";

import React, { useState, useCallback, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import AppDatePicker from "@/components/form/AppDatePicker";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import reportsService from "@/services/reportsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { ApAgingReport as ApAgingData, ApAgingVendor, AgingBill } from "@/types/reports";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function shortDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type BucketKey = "current" | "days1to30" | "days31to60" | "days61to90" | "days91plus";

const BUCKET_LABELS: Record<BucketKey, string> = {
  current: "Current",
  days1to30: "1–30 Days",
  days31to60: "31–60 Days",
  days61to90: "61–90 Days",
  days91plus: "91+ Days",
};

const BUCKET_COLORS: Record<BucketKey, { text: string; bg: string; badge: string }> = {
  current: {
    text: "text-success-700 dark:text-success-400",
    bg: "bg-success-50 dark:bg-success-900/20",
    badge: "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300",
  },
  days1to30: {
    text: "text-yellow-700 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  },
  days31to60: {
    text: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  days61to90: {
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
  days91plus: {
    text: "text-red-900 dark:text-red-300",
    bg: "bg-red-100 dark:bg-red-900/30",
    badge: "bg-red-200 text-red-900 dark:bg-red-800/50 dark:text-red-200",
  },
};

const BUCKETS: BucketKey[] = ["current", "days1to30", "days31to60", "days61to90", "days91plus"];

// ── Bill sub-rows ─────────────────────────────────────────────
const BillRows: React.FC<{ bills: AgingBill[] }> = ({ bills }) => (
  <tr>
    <td colSpan={7} className="p-0">
      <div className="border-t border-gray-100 bg-gray-50/60 dark:border-gray-700 dark:bg-gray-800/40">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 dark:text-gray-500">
              <th className="px-8 py-2 text-left font-medium">Bill #</th>
              <th className="px-3 py-2 text-left font-medium">Bill Date</th>
              <th className="px-3 py-2 text-left font-medium">Due Date</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
              <th className="px-3 py-2 text-right font-medium">Amount Due</th>
              <th className="px-3 py-2 text-center font-medium">Days Overdue</th>
              <th className="px-3 py-2 text-center font-medium">Bucket</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {bills.map((bill) => {
              const bc = BUCKET_COLORS[bill.bucket];
              return (
                <tr key={bill.billId} className="bg-white dark:bg-gray-900/20">
                  <td className="px-8 py-2 font-mono font-semibold text-orange-600 dark:text-orange-400">
                    {bill.billNumber}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{shortDate(bill.billDate)}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{shortDate(bill.dueDate)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                    {formatCurrency(bill.totalAmount)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(bill.amountDue)}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                    {bill.daysOverdue === 0 ? "—" : `${bill.daysOverdue}d`}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${bc.badge}`}>
                      {BUCKET_LABELS[bill.bucket]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </td>
  </tr>
);

// ── Skeleton ──────────────────────────────────────────────────
const Skeleton: React.FC = () => (
  <div className="animate-pulse space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="h-8 w-1/3 rounded bg-gray-100 dark:bg-gray-800" />
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex gap-4">
        <div className="h-10 flex-1 rounded bg-gray-100 dark:bg-gray-800" />
        {[...Array(5)].map((__, j) => (
          <div key={j} className="h-10 w-24 rounded bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    ))}
  </div>
);

// ── Main Component ────────────────────────────────────────────
const ApAgingReport: React.FC = () => {
  const { token } = useAuth();
  const [asOfDate, setAsOfDate] = useState(todayStr());
  const [data, setData] = useState<ApAgingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchReport = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await reportsService.getApAging(
        { asOfDate: asOfDate || undefined },
        token
      );
      setData(result);
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, asOfDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["Vendor", "Current", "1-30 Days", "31-60 Days", "61-90 Days", "91+ Days", "Total"],
      ...data.vendors.map((v) => [
        v.vendorName,
        v.current,
        v.days1to30,
        v.days31to60,
        v.days61to90,
        v.days91plus,
        v.total,
      ]),
      [
        "TOTAL",
        data.totals.current,
        data.totals.days1to30,
        data.totals.days31to60,
        data.totals.days61to90,
        data.totals.days91plus,
        data.totals.total,
      ],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ap-aging-${asOfDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-end">
        <div className="w-full sm:w-48">
          <Label>As Of Date</Label>
          <AppDatePicker value={asOfDate} onChange={(val) => setAsOfDate(val)} maxToday />
        </div>
        <Button size="sm" onClick={fetchReport} disabled={loading}>
          {loading ? "Loading..." : "Generate"}
        </Button>
        {data && (
          <Button size="sm" variant="outline" onClick={exportCsv}>
            Export CSV
          </Button>
        )}
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {/* Summary Buckets */}
      {data && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {BUCKETS.map((bucket) => {
            const bc = BUCKET_COLORS[bucket];
            return (
              <div key={bucket} className={`rounded-xl border p-3 text-center ${bc.bg}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {BUCKET_LABELS[bucket]}
                </p>
                <p className={`mt-1 text-base font-bold tabular-nums ${bc.text}`}>
                  {formatCurrency(data.totals[bucket])}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <Skeleton />
      ) : data ? (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          {/* Title */}
          <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-gray-800">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Accounts Payable Aging
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                As of {shortDate(data.asOfDate)} · {data.vendors.length} vendor{data.vendors.length !== 1 ? "s" : ""}
              </p>
            </div>
            <span className="rounded-xl bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
              Total AP: {formatCurrency(data.totals.total)}
            </span>
          </div>

          {data.vendors.length === 0 ? (
            <div className="p-8 text-center text-sm italic text-gray-400 dark:text-gray-500">
              No outstanding payables as of this date.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Vendor
                    </th>
                    {BUCKETS.map((b) => (
                      <th key={b} className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {BUCKET_LABELS[b]}
                      </th>
                    ))}
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.vendors.map((vendor) => {
                    const isOpen = expandedRows.has(vendor.vendorId);
                    return (
                      <React.Fragment key={vendor.vendorId}>
                        <tr
                          className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
                          onClick={() => toggleRow(vendor.vendorId)}
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <svg
                                className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {vendor.vendorName}
                              </span>
                              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                {vendor.bills.length} bill{vendor.bills.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </td>
                          {BUCKETS.map((b) => {
                            const amt = vendor[b] ?? 0;
                            const bc = BUCKET_COLORS[b];
                            return (
                              <td key={b} className="px-3 py-3 text-right">
                                <span className={`text-sm tabular-nums ${amt > 0 ? bc.text : "text-gray-300 dark:text-gray-600"}`}>
                                  {amt > 0 ? formatCurrency(amt) : "—"}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-5 py-3 text-right">
                            <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                              {formatCurrency(vendor.total)}
                            </span>
                          </td>
                        </tr>
                        {isOpen && <BillRows bills={vendor.bills} />}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800/60">
                    <td className="px-5 py-3 text-sm font-bold uppercase text-gray-700 dark:text-gray-300">
                      Total
                    </td>
                    {BUCKETS.map((b) => {
                      const bc = BUCKET_COLORS[b];
                      return (
                        <td key={b} className="px-3 py-3 text-right">
                          <span className={`text-sm font-bold tabular-nums ${data.totals[b] > 0 ? bc.text : "text-gray-400 dark:text-gray-500"}`}>
                            {data.totals[b] > 0 ? formatCurrency(data.totals[b]) : "—"}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-5 py-3 text-right">
                      <span className="text-base font-bold tabular-nums text-gray-900 dark:text-white">
                        {formatCurrency(data.totals.total)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default ApAgingReport;
