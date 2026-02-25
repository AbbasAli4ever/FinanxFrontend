"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import { useAuth } from "@/context/AuthContext";
import reportsService from "@/services/reportsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { TrialBalanceResponse, TrialBalanceAccount } from "@/types/reports";

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

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  BANK: "Bank",
  ACCOUNTS_RECEIVABLE: "Accounts Receivable",
  OTHER_CURRENT_ASSET: "Other Current Assets",
  FIXED_ASSET: "Fixed Assets",
  OTHER_ASSET: "Other Assets",
  ACCOUNTS_PAYABLE: "Accounts Payable",
  CREDIT_CARD: "Credit Card",
  OTHER_CURRENT_LIABILITY: "Other Current Liabilities",
  LONG_TERM_LIABILITY: "Long-term Liabilities",
  EQUITY: "Equity",
  INCOME: "Income",
  COST_OF_GOODS_SOLD: "Cost of Goods Sold",
  EXPENSE: "Expenses",
  OTHER_INCOME: "Other Income",
  OTHER_EXPENSE: "Other Expenses",
};

const TrialBalanceReport: React.FC = () => {
  const { token } = useAuth();

  const [asOfDate, setAsOfDate] = useState(todayStr());
  const [data, setData] = useState<TrialBalanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showZero, setShowZero] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await reportsService.getTrialBalance({ asOfDate }, token);
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

  const filterAccounts = (accounts: TrialBalanceAccount[]): TrialBalanceAccount[] => {
    if (showZero) return accounts;
    return accounts.filter((a) => a.debitBalance !== 0 || a.creditBalance !== 0);
  };

  const groupKeys = data ? Object.keys(data.grouped) : [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-end">
        <div className="flex-1 max-w-xs">
          <Label>As of Date</Label>
          <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={showZero}
            onChange={(e) => setShowZero(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          Show zero-balance accounts
        </label>
        <Button size="sm" onClick={fetchReport} disabled={loading}>
          {loading ? "Loading..." : "Generate"}
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Generating trial balance...</span>
          </div>
        </div>
      ) : data ? (
        <>
          {/* Report Header */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trial Balance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  As of {formatDate(data.asOfDate)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  size="sm"
                  variant="light"
                  color={data.totals.isBalanced ? "success" : "error"}
                >
                  {data.totals.isBalanced ? "Balanced" : "Out of Balance"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Report Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-800">
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Account #</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Account Name</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Debit</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Credit</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupKeys.map((groupKey) => {
                    const accounts = filterAccounts(data.grouped[groupKey]);
                    if (accounts.length === 0) return null;

                    const groupDebit = accounts.reduce((s, a) => s + a.debitBalance, 0);
                    const groupCredit = accounts.reduce((s, a) => s + a.creditBalance, 0);

                    return (
                      <React.Fragment key={groupKey}>
                        {/* Group Header */}
                        <tr className="bg-gray-50/70 dark:bg-gray-800/40">
                          <td colSpan={5} className="px-4 py-2.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                              {ACCOUNT_TYPE_LABELS[groupKey] || groupKey}
                            </span>
                          </td>
                        </tr>

                        {accounts.map((account) => (
                          <TableRow key={account.id} className="border-b border-gray-100 transition hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                            <TableCell className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 font-mono">
                              {account.accountNumber || "—"}
                            </TableCell>
                            <TableCell className="px-4 py-2.5 text-sm text-gray-900 dark:text-white/90">
                              {account.name}
                            </TableCell>
                            <TableCell className="px-4 py-2.5 text-center">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {account.normalBalance}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-2.5 text-right text-sm tabular-nums font-medium text-gray-900 dark:text-white/90">
                              {account.debitBalance > 0 ? formatCurrency(account.debitBalance) : ""}
                            </TableCell>
                            <TableCell className="px-4 py-2.5 text-right text-sm tabular-nums font-medium text-gray-900 dark:text-white/90">
                              {account.creditBalance > 0 ? formatCurrency(account.creditBalance) : ""}
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Group Subtotal */}
                        <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                          <td colSpan={3} className="px-4 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">
                            Subtotal — {ACCOUNT_TYPE_LABELS[groupKey] || groupKey}
                          </td>
                          <td className="px-4 py-2 text-right text-sm tabular-nums font-semibold text-gray-700 dark:text-gray-300">
                            {groupDebit > 0 ? formatCurrency(groupDebit) : ""}
                          </td>
                          <td className="px-4 py-2 text-right text-sm tabular-nums font-semibold text-gray-700 dark:text-gray-300">
                            {groupCredit > 0 ? formatCurrency(groupCredit) : ""}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Totals Footer */}
            <div className={`border-t-2 px-4 py-4 ${data.totals.isBalanced ? "border-success-300 bg-success-50/50 dark:border-success-800 dark:bg-success-900/10" : "border-error-300 bg-error-50/50 dark:border-error-800 dark:bg-error-900/10"}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${data.totals.isBalanced ? "text-success-700 dark:text-success-300" : "text-error-700 dark:text-error-300"}`}>
                  {data.totals.isBalanced ? "Total (Balanced)" : "Total (OUT OF BALANCE)"}
                </span>
                <div className="flex gap-12">
                  <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(data.totals.totalDebits)}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(data.totals.totalCredits)}
                  </span>
                </div>
              </div>
              {!data.totals.isBalanced && (
                <p className="mt-1 text-xs text-error-600 dark:text-error-400">
                  Difference: {formatCurrency(Math.abs(data.totals.totalDebits - data.totals.totalCredits))}
                </p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default TrialBalanceReport;
