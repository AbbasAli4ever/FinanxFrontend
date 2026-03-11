"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import Alert from "@/components/ui/alert/Alert";
import {
  isPermissionDeniedError,
  getPermissionDeniedMessage,
} from "@/services/apiClient";
import { formatApiErrorMessage } from "@/utils/apiError";
import taxesService from "@/services/taxesService";
import type { TaxSummary, TaxByRateReport, Vendor1099Report } from "@/types/taxes";

type AlertState = { variant: "success" | "error" | "warning"; title: string; message: string };

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function fmtNum(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function thisYearRange() {
  const now = new Date();
  return {
    startDate: `${now.getFullYear()}-01-01`,
    endDate: `${now.getFullYear()}-12-31`,
  };
}

function lastYearRange() {
  const y = new Date().getFullYear() - 1;
  return { startDate: `${y}-01-01`, endDate: `${y}-12-31` };
}

function thisQuarterRange() {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const start = new Date(now.getFullYear(), q * 3, 1);
  const end = new Date(now.getFullYear(), q * 3 + 3, 0);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

const DATE_PRESETS = [
  { label: "This Year", fn: thisYearRange },
  { label: "Last Year", fn: lastYearRange },
  { label: "This Quarter", fn: thisQuarterRange },
  { label: "All Time", fn: () => ({ startDate: "", endDate: "" }) },
];

// ── Summary KPI card ──────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  bg,
  textColor,
  accentColor,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  bg: string;
  textColor: string;
  accentColor: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm ${bg}`}>
      <div className="flex items-start justify-between">
        <p className={`text-xs font-medium uppercase tracking-wider ${textColor}`}>{label}</p>
        <span className={`${textColor} opacity-70`}>{icon}</span>
      </div>
      <p className={`mt-3 text-2xl font-bold ${accentColor}`}>{value}</p>
      {sub && <p className={`mt-1 text-xs ${textColor}`}>{sub}</p>}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`} />;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TaxReportsPage() {
  const { token, isAuthenticated, isReady } = useAuth();
  const { loading: permissionsLoading } = usePermissions();

  const [startDate, setStartDate] = useState(thisYearRange().startDate);
  const [endDate, setEndDate] = useState(thisYearRange().endDate);
  const [activePreset, setActivePreset] = useState("This Year");
  const [activeReportTab, setActiveReportTab] = useState<"by-rate" | "1099">("by-rate");

  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [byRate, setByRate] = useState<TaxByRateReport | null>(null);
  const [report1099, setReport1099] = useState<Vendor1099Report | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  // ── Fetch all reports ─────────────────────────────────────────────────────

  const fetchAll = useCallback(
    async (sd: string, ed: string) => {
      if (!token) return;
      setLoadingSummary(true);
      setLoadingDetail(true);
      setAlert(null);

      const s = sd || undefined;
      const e = ed || undefined;

      try {
        const sum = await taxesService.getSummaryReport(token, s, e);
        setSummary(sum);
      } catch (err) {
        if (isPermissionDeniedError(err)) {
          setAlert({ variant: "warning", title: "Access Restricted", message: getPermissionDeniedMessage(err) });
        } else {
          setAlert({ variant: "error", title: "Failed to load summary", message: formatApiErrorMessage(err) });
        }
      } finally {
        setLoadingSummary(false);
      }

      try {
        const [br, r1099] = await Promise.all([
          taxesService.getByRateReport(token, s, e),
          taxesService.get1099Report(token, s, e),
        ]);
        setByRate(br);
        setReport1099(r1099);
      } catch (err) {
        if (!isPermissionDeniedError(err)) {
          setAlert({ variant: "error", title: "Failed to load detail reports", message: formatApiErrorMessage(err) });
        }
      } finally {
        setLoadingDetail(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!isReady || !isAuthenticated || permissionsLoading) return;
    fetchAll(startDate, endDate);
  }, [isReady, isAuthenticated, permissionsLoading]); // eslint-disable-line

  const applyPreset = (label: string, fn: () => { startDate: string; endDate: string }) => {
    const range = fn();
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setActivePreset(label);
    fetchAll(range.startDate, range.endDate);
  };

  const handleApplyDates = () => {
    setActivePreset("Custom");
    fetchAll(startDate, endDate);
  };

  if (!isReady || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const netPositive = (summary?.netTaxLiability ?? 0) >= 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/tax-management"
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tax Reports</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Tax collected, paid, and net liability overview.</p>
          </div>
        </div>
      </header>

      {/* ── Alert ── */}
      {alert && <Alert variant={alert.variant} title={alert.title} message={alert.message} />}

      {/* ── Date controls ── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.label, p.fn)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activePreset === p.label
                    ? "bg-brand-500 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-800 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
            />
            <span className="text-gray-400 text-sm">→</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-800 dark:text-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
            />
            <button
              onClick={handleApplyDates}
              className="h-9 px-4 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary KPIs ── */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Sales Tax Collected"
              value={fmt(summary.salesTaxCollected)}
              sub="from invoices"
              bg="bg-success-50 dark:bg-success-900/20"
              textColor="text-success-600 dark:text-success-400"
              accentColor="text-success-700 dark:text-success-300"
              icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>}
            />
            <KpiCard
              label="Purchase Tax Paid"
              value={fmt(summary.purchaseTaxPaid)}
              sub="from bills"
              bg="bg-blue-50 dark:bg-blue-900/20"
              textColor="text-blue-600 dark:text-blue-400"
              accentColor="text-blue-700 dark:text-blue-300"
              icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H13a1 1 0 100-2H8.414l1.293-1.293z" clipRule="evenodd" /></svg>}
            />
            <KpiCard
              label="Expense Tax"
              value={fmt(summary.expenseTax.total)}
              sub={`${fmt(summary.expenseTax.deductible)} deductible`}
              bg="bg-warning-50 dark:bg-warning-900/20"
              textColor="text-warning-600 dark:text-warning-400"
              accentColor="text-warning-700 dark:text-warning-300"
              icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>}
            />
            <KpiCard
              label="Net Tax Liability"
              value={fmt(Math.abs(summary.netTaxLiability))}
              sub={netPositive ? "you owe tax" : "refund owed to you"}
              bg={netPositive ? "bg-error-50 dark:bg-error-900/20" : "bg-success-50 dark:bg-success-900/20"}
              textColor={netPositive ? "text-error-600 dark:text-error-400" : "text-success-600 dark:text-success-400"}
              accentColor={netPositive ? "text-error-700 dark:text-error-300" : "text-success-700 dark:text-success-300"}
              icon={<svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>}
            />
          </div>

          {/* Net liability breakdown */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Net Tax Liability Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: "Sales Tax Collected", value: summary.salesTaxCollected, color: "text-success-600 dark:text-success-400", sign: "+" },
                { label: "Purchase Tax Paid", value: -summary.purchaseTaxPaid, color: "text-blue-600 dark:text-blue-400", sign: "−" },
                { label: "Deductible Expense Tax", value: -summary.expenseTax.deductible, color: "text-warning-600 dark:text-warning-400", sign: "−" },
              ].map(({ label, value, color, sign }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{sign} {label}</span>
                  <span className={`text-sm font-semibold ${color}`}>{fmt(Math.abs(value))}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-bold text-gray-800 dark:text-white">= Net Tax Liability</span>
                <span className={`text-lg font-bold ${netPositive ? "text-error-600 dark:text-error-400" : "text-success-600 dark:text-success-400"}`}>
                  {netPositive ? "" : "−"}{fmt(Math.abs(summary.netTaxLiability))}
                  {netPositive
                    ? <span className="ml-2 text-xs font-medium text-error-500 dark:text-error-400 bg-error-50 dark:bg-error-900/30 rounded-full px-2 py-0.5">Owe</span>
                    : <span className="ml-2 text-xs font-medium text-success-500 dark:text-success-400 bg-success-50 dark:bg-success-900/30 rounded-full px-2 py-0.5">Refund</span>
                  }
                </span>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* ── Detail reports (by-rate + 1099) ── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          {(["by-rate", "1099"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveReportTab(tab)}
              className={`flex-1 sm:flex-none px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeReportTab === tab
                  ? "border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-900/10"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              {tab === "by-rate" ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                  Breakdown by Rate
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                  1099 Vendor Report
                </span>
              )}
            </button>
          ))}
        </div>

        {loadingDetail ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ── By Rate tab ── */}
            {activeReportTab === "by-rate" && byRate && (
              <div>
                {byRate.rateBreakdowns.length === 0 && byRate.unlinked.invoiceLineCount === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No rate data for this period</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tax Rate</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invoice Lines</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invoice Taxable</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bill Lines</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bill Taxable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {byRate.rateBreakdowns.map((br) => (
                        <tr key={br.taxRate.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">{br.taxRate.name}</span>
                              <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5">{br.taxRate.code}</span>
                              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{fmtNum(br.taxRate.rate)}%</span>
                              {!br.taxRate.isActive && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 italic">(inactive)</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right text-gray-700 dark:text-gray-300">{br.invoiceLineCount}</td>
                          <td className="px-4 py-4 text-right font-medium text-success-600 dark:text-success-400">{fmt(br.invoiceTaxableAmount)}</td>
                          <td className="px-4 py-4 text-right text-gray-700 dark:text-gray-300">{br.billLineCount}</td>
                          <td className="px-6 py-4 text-right font-medium text-blue-600 dark:text-blue-400">{fmt(br.billTaxableAmount)}</td>
                        </tr>
                      ))}

                      {/* Unlinked row */}
                      {(byRate.unlinked.invoiceLineCount > 0 || byRate.unlinked.billLineCount > 0) && (
                        <tr className="bg-warning-50/50 dark:bg-warning-900/10 border-t-2 border-warning-200 dark:border-warning-800">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-warning-700 dark:text-warning-400">Manual (Unlinked)</span>
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400">
                                Action needed
                              </span>
                            </div>
                            <p className="text-xs text-warning-600 dark:text-warning-500 mt-0.5">
                              These use manual tax% without a linked rate — consider linking them.
                            </p>
                          </td>
                          <td className="px-4 py-4 text-right text-warning-600 dark:text-warning-400 font-medium">{byRate.unlinked.invoiceLineCount}</td>
                          <td className="px-4 py-4 text-right font-medium text-warning-600 dark:text-warning-400">{fmt(byRate.unlinked.invoiceTaxableAmount)}</td>
                          <td className="px-4 py-4 text-right text-warning-600 dark:text-warning-400 font-medium">{byRate.unlinked.billLineCount}</td>
                          <td className="px-6 py-4 text-right font-medium text-warning-600 dark:text-warning-400">{fmt(byRate.unlinked.billTaxableAmount)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── 1099 tab ── */}
            {activeReportTab === "1099" && report1099 && (
              <div>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-900 dark:text-white">{report1099.vendorCount}</span> vendor{report1099.vendorCount !== 1 ? "s" : ""} with 1099 tracking
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">IRS threshold: $600 per vendor</span>
                </div>

                {report1099.vendors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No 1099 vendors this period</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Vendors must have 1099 tracking enabled and payments {">"} $0.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vendor</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tax Number</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bills</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Payments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {report1099.vendors.map(({ vendor, totalPayments, billCount }) => {
                        const overThreshold = totalPayments >= 600;
                        return (
                          <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-white">{vendor.displayName}</span>
                                {overThreshold && (
                                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-error-50 dark:bg-error-900/30 text-error-700 dark:text-error-400">
                                    IRS Required
                                  </span>
                                )}
                              </div>
                              {vendor.businessIdNo && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">EIN: {vendor.businessIdNo}</p>
                              )}
                            </td>
                            <td className="px-4 py-4 font-mono text-gray-700 dark:text-gray-300 text-xs">
                              {vendor.taxNumber ?? <span className="italic text-gray-400">—</span>}
                            </td>
                            <td className="px-4 py-4 text-right text-gray-700 dark:text-gray-300">{billCount}</td>
                            <td className="px-6 py-4 text-right">
                              <span className={`font-bold ${overThreshold ? "text-error-600 dark:text-error-400" : "text-gray-700 dark:text-gray-300"}`}>
                                {fmt(totalPayments)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
