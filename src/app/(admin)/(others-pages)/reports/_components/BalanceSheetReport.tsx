"use client";

import React, { useState, useCallback, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import { useAuth } from "@/context/AuthContext";
import reportsService from "@/services/reportsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { BalanceSheetResponse, BalanceSheetAccount } from "@/types/reports";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

interface AccountSectionProps {
  title: string;
  accounts: BalanceSheetAccount[];
  total: number;
  headerColor: string;
  extraRows?: { label: string; amount: number; italic?: boolean }[];
  finalTotal?: { label: string; amount: number };
}

const AccountSection: React.FC<AccountSectionProps> = ({
  title,
  accounts,
  total,
  headerColor,
  extraRows,
  finalTotal,
}) => (
  <div className="space-y-1">
    <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 ${headerColor}`}>
      <span className="text-sm font-bold uppercase tracking-wider">{title}</span>
    </div>
    {accounts.length > 0 ? (
      accounts.map((acc) => (
        <div key={acc.id} className="flex items-center justify-between px-6 py-2 text-sm">
          <span className="text-gray-700 dark:text-gray-300">
            {acc.accountNumber ? <span className="font-mono text-gray-400 dark:text-gray-500 mr-2">{acc.accountNumber}</span> : null}
            {acc.name}
          </span>
          <span className="tabular-nums font-medium text-gray-900 dark:text-white">
            {formatCurrency(acc.balance)}
          </span>
        </div>
      ))
    ) : (
      <div className="px-6 py-2 text-sm text-gray-400 dark:text-gray-500 italic">
        No accounts
      </div>
    )}

    {/* Subtotal */}
    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-2 dark:border-gray-700">
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Total {title}
      </span>
      <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
        {formatCurrency(total)}
      </span>
    </div>

    {/* Extra rows (e.g. Net Income in Equity) */}
    {extraRows?.map((row, i) => (
      <div key={i} className="flex items-center justify-between px-6 py-1.5 text-sm">
        <span className={`text-gray-600 dark:text-gray-400 ${row.italic ? "italic" : ""}`}>
          {row.label}
        </span>
        <span className="tabular-nums font-medium text-gray-900 dark:text-white">
          {formatCurrency(row.amount)}
        </span>
      </div>
    ))}

    {/* Final total (e.g. Total Equity incl. Net Income) */}
    {finalTotal && (
      <div className="flex items-center justify-between border-t border-gray-300 px-6 py-2.5 dark:border-gray-600">
        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
          {finalTotal.label}
        </span>
        <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
          {formatCurrency(finalTotal.amount)}
        </span>
      </div>
    )}
  </div>
);

const BalanceSheetReport: React.FC = () => {
  const { token } = useAuth();

  const [asOfDate, setAsOfDate] = useState(todayStr());
  const [data, setData] = useState<BalanceSheetResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await reportsService.getBalanceSheet({ asOfDate }, token);
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-end">
        <div className="flex-1 max-w-xs">
          <Label>As of Date</Label>
          <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
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
            <span className="text-sm text-gray-500 dark:text-gray-400">Generating balance sheet...</span>
          </div>
        </div>
      ) : data ? (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          {/* Report Header */}
          <div className="border-b border-gray-200 p-6 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Balance Sheet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  As of {formatDate(data.asOfDate)}
                </p>
              </div>
              <Badge
                size="sm"
                variant="light"
                color={data.totals.isBalanced ? "success" : "error"}
              >
                {data.totals.isBalanced ? "Balanced" : "Out of Balance"}
              </Badge>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {/* Assets */}
            <div className="p-4">
              <AccountSection
                title="Assets"
                accounts={data.assets.accounts}
                total={data.assets.total}
                headerColor="bg-blue-50/50 text-blue-700 dark:bg-blue-900/10 dark:text-blue-300"
              />
            </div>

            {/* Total Assets — prominent */}
            <div className="px-4 py-4">
              <div className="flex items-center justify-between rounded-xl border-2 border-blue-200 bg-blue-50/40 px-6 py-4 dark:border-blue-800 dark:bg-blue-900/10">
                <span className="text-base font-bold text-blue-700 dark:text-blue-300">Total Assets</span>
                <span className="text-xl font-bold tabular-nums text-blue-700 dark:text-blue-300">
                  {formatCurrency(data.totals.totalAssets)}
                </span>
              </div>
            </div>

            {/* Liabilities */}
            <div className="p-4">
              <AccountSection
                title="Liabilities"
                accounts={data.liabilities.accounts}
                total={data.liabilities.total}
                headerColor="bg-warning-50/50 text-warning-700 dark:bg-warning-900/10 dark:text-warning-300"
              />
            </div>

            {/* Equity */}
            <div className="p-4">
              <AccountSection
                title="Equity"
                accounts={data.equity.accounts}
                total={data.equity.total}
                headerColor="bg-purple-50/50 text-purple-700 dark:bg-purple-900/10 dark:text-purple-300"
                extraRows={[
                  { label: "Net Income (Current Period)", amount: data.equity.netIncome, italic: true },
                ]}
                finalTotal={{
                  label: "Total Equity (incl. Net Income)",
                  amount: data.equity.totalIncludingNetIncome,
                }}
              />
            </div>

            {/* Total Liabilities + Equity */}
            <div className="px-4 py-6">
              <div className={`flex items-center justify-between rounded-xl border-2 px-6 py-5 ${data.totals.isBalanced ? "border-success-300 bg-success-50/60 dark:border-success-800 dark:bg-success-900/20" : "border-error-300 bg-error-50/60 dark:border-error-800 dark:bg-error-900/20"}`}>
                <div>
                  <span className={`text-lg font-bold ${data.totals.isBalanced ? "text-success-700 dark:text-success-300" : "text-error-700 dark:text-error-300"}`}>
                    Total Liabilities & Equity
                  </span>
                  {!data.totals.isBalanced && (
                    <p className="text-xs text-error-600 dark:text-error-400 mt-0.5">
                      Difference: {formatCurrency(Math.abs(data.totals.totalAssets - data.totals.totalLiabilitiesAndEquity))}
                    </p>
                  )}
                </div>
                <span className={`text-2xl font-bold tabular-nums ${data.totals.isBalanced ? "text-success-700 dark:text-success-300" : "text-error-700 dark:text-error-300"}`}>
                  {formatCurrency(data.totals.totalLiabilitiesAndEquity)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BalanceSheetReport;
