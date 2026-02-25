"use client";

import React, { useState, useCallback, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import reportsService from "@/services/reportsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { IncomeStatementResponse, IncomeStatementAccount } from "@/types/reports";

const selectClasses =
  "h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDateLong(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function firstDayOfYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-01-01`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
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

interface SectionRowProps {
  accounts: IncomeStatementAccount[];
  total: number;
  label: string;
  color: string;
}

const SectionBlock: React.FC<SectionRowProps> = ({ accounts, total, label, color }) => (
  <div className="space-y-1">
    <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 ${color}`}>
      <span className="text-sm font-bold uppercase tracking-wider">{label}</span>
    </div>
    {accounts.length > 0 ? (
      accounts.map((acc) => (
        <div key={acc.id} className="flex items-center justify-between px-6 py-2 text-sm">
          <span className="text-gray-700 dark:text-gray-300">
            {acc.accountNumber ? <span className="font-mono text-gray-400 dark:text-gray-500 mr-2">{acc.accountNumber}</span> : null}
            {acc.name}
          </span>
          <span className="tabular-nums font-medium text-gray-900 dark:text-white">
            {formatCurrency(acc.amount)}
          </span>
        </div>
      ))
    ) : (
      <div className="px-6 py-2 text-sm text-gray-400 dark:text-gray-500 italic">
        No accounts in this period
      </div>
    )}
    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-2 dark:border-gray-700">
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Total {label}
      </span>
      <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
        {formatCurrency(total)}
      </span>
    </div>
  </div>
);

const IncomeStatementReport: React.FC = () => {
  const { token } = useAuth();

  const [preset, setPreset] = useState<PresetKey>("YTD");
  const [startDate, setStartDate] = useState(firstDayOfYear());
  const [endDate, setEndDate] = useState(todayStr());
  const [data, setData] = useState<IncomeStatementResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const result = await reportsService.getIncomeStatement(
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

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-end">
        <div>
          <Label>Period</Label>
          <select
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value as PresetKey)}
            className={selectClasses}
          >
            {PRESETS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-44">
          <Label>Start Date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPreset("CUSTOM"); }}
          />
        </div>
        <div className="w-full sm:w-44">
          <Label>End Date</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPreset("CUSTOM"); }}
          />
        </div>
        <Button size="sm" onClick={fetchReport} disabled={loading}>
          {loading ? "Loading..." : "Generate"}
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Generating income statement...</span>
          </div>
        </div>
      ) : data ? (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          {/* Report Title */}
          <div className="border-b border-gray-200 p-6 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Income Statement (Profit & Loss)</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDateLong(data.period.startDate)} — {formatDateLong(data.period.endDate)}
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {/* Revenue */}
            <div className="p-4">
              <SectionBlock
                accounts={data.revenue.accounts}
                total={data.revenue.total}
                label="Revenue"
                color="bg-success-50/50 text-success-700 dark:bg-success-900/10 dark:text-success-300"
              />
            </div>

            {/* Cost of Goods Sold */}
            <div className="p-4">
              <SectionBlock
                accounts={data.costOfGoodsSold.accounts}
                total={data.costOfGoodsSold.total}
                label="Cost of Goods Sold"
                color="bg-warning-50/50 text-warning-700 dark:bg-warning-900/10 dark:text-warning-300"
              />
            </div>

            {/* Gross Profit */}
            <div className="px-4 py-4">
              <div className="flex items-center justify-between rounded-xl border-2 border-brand-200 bg-brand-50/40 px-6 py-4 dark:border-brand-800 dark:bg-brand-900/10">
                <span className="text-base font-bold text-brand-700 dark:text-brand-300">Gross Profit</span>
                <span className={`text-xl font-bold tabular-nums ${data.grossProfit >= 0 ? "text-brand-700 dark:text-brand-300" : "text-error-600 dark:text-error-400"}`}>
                  {formatCurrency(data.grossProfit)}
                </span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="p-4">
              <SectionBlock
                accounts={data.expenses.accounts}
                total={data.expenses.total}
                label="Operating Expenses"
                color="bg-error-50/50 text-error-700 dark:bg-error-900/10 dark:text-error-300"
              />
            </div>

            {/* Net Income */}
            <div className="px-4 py-6">
              <div className={`flex items-center justify-between rounded-xl border-2 px-6 py-5 ${data.netIncome >= 0 ? "border-success-300 bg-success-50/60 dark:border-success-800 dark:bg-success-900/20" : "border-error-300 bg-error-50/60 dark:border-error-800 dark:bg-error-900/20"}`}>
                <div>
                  <span className={`text-lg font-bold ${data.netIncome >= 0 ? "text-success-700 dark:text-success-300" : "text-error-700 dark:text-error-300"}`}>
                    Net Income
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Gross Profit ({formatCurrency(data.grossProfit)}) − Expenses ({formatCurrency(data.expenses.total)})
                  </p>
                </div>
                <span className={`text-2xl font-bold tabular-nums ${data.netIncome >= 0 ? "text-success-700 dark:text-success-300" : "text-error-700 dark:text-error-300"}`}>
                  {formatCurrency(data.netIncome)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default IncomeStatementReport;
