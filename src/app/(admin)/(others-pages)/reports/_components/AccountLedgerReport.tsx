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
import { useAuth } from "@/context/AuthContext";
import reportsService from "@/services/reportsService";
import accountsService from "@/services/accountsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { AccountLedgerResponse } from "@/types/reports";

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateLong(dateStr: string | null): string {
  if (!dateStr) return "All Time";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function firstDayOfYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-01-01`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

const AccountLedgerReport: React.FC = () => {
  const { token } = useAuth();

  const [accountsList, setAccountsList] = useState<{ id: string; name: string; accountNumber: string }[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [startDate, setStartDate] = useState(firstDayOfYear());
  const [endDate, setEndDate] = useState(todayStr());
  const [data, setData] = useState<AccountLedgerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch accounts for selector
  useEffect(() => {
    if (!token) return;
    accountsService
      .getAccounts({ isActive: "true", sortBy: "accountNumber", sortOrder: "asc" }, token)
      .then((accounts) =>
        setAccountsList(accounts.map((a) => ({ id: a.id, name: a.name, accountNumber: a.accountNumber })))
      )
      .catch(() => { /* Non-critical */ });
  }, [token]);

  const fetchReport = useCallback(async () => {
    if (!token || !selectedAccountId) return;
    setLoading(true);
    setError("");
    try {
      const result = await reportsService.getAccountLedger(
        selectedAccountId,
        { startDate: startDate || undefined, endDate: endDate || undefined },
        token
      );
      setData(result);
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, selectedAccountId, startDate, endDate]);

  const handleGenerate = () => {
    if (!selectedAccountId) {
      setError("Please select an account.");
      return;
    }
    fetchReport();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label>Account <span className="text-error-500">*</span></Label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className={selectClasses}
          >
            <option value="">Select an account</option>
            {accountsList.map((a) => (
              <option key={a.id} value={a.id}>
                {a.accountNumber} — {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-44">
          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="w-full sm:w-44">
          <Label>End Date</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Button size="sm" onClick={handleGenerate} disabled={loading}>
          {loading ? "Loading..." : "Generate"}
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Generating account ledger...</span>
          </div>
        </div>
      ) : data ? (
        <>
          {/* Account Header */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {data.account.accountNumber ? `${data.account.accountNumber} — ` : ""}{data.account.name}
                </h3>
                <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <span>Type: {data.account.accountType}</span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span>Normal Balance: {data.account.normalBalance}</span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span>
                    Period: {formatDateLong(data.period.startDate)} – {formatDateLong(data.period.endDate)}
                  </span>
                </div>
              </div>
              <div className="flex gap-6 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Opening</p>
                  <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(data.openingBalance)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Closing</p>
                  <p className="text-lg font-bold tabular-nums text-brand-600 dark:text-brand-400">
                    {formatCurrency(data.closingBalance)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-b border-gray-200 dark:border-gray-800">
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Entry #</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Description</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Debit</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Credit</TableCell>
                    <TableCell isHeader className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Balance</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Opening Balance Row */}
                  <tr className="bg-gray-50/70 dark:bg-gray-800/40">
                    <td colSpan={5} className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Opening Balance
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                      {formatCurrency(data.openingBalance)}
                    </td>
                  </tr>

                  {data.lines.map((line, idx) => {
                    // Determine if balance is in normal direction
                    const isNormalDirection =
                      (data.account.normalBalance === "DEBIT" && line.balance >= 0) ||
                      (data.account.normalBalance === "CREDIT" && line.balance >= 0);

                    return (
                      <TableRow key={`${line.entryId}-${idx}`} className="border-b border-gray-100 transition hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                        <TableCell className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(line.date)}
                        </TableCell>
                        <TableCell className="px-4 py-2.5">
                          <span className="text-sm font-medium text-brand-500 dark:text-brand-400">
                            {line.entryNumber}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-sm text-gray-900 dark:text-white/90 max-w-[250px] truncate">
                          {line.description || "—"}
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-right text-sm tabular-nums font-medium text-gray-900 dark:text-white/90">
                          {line.debit > 0 ? formatCurrency(line.debit) : ""}
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-right text-sm tabular-nums font-medium text-gray-900 dark:text-white/90">
                          {line.credit > 0 ? formatCurrency(line.credit) : ""}
                        </TableCell>
                        <TableCell className={`px-4 py-2.5 text-right text-sm tabular-nums font-bold ${isNormalDirection ? "text-gray-900 dark:text-white" : "text-error-600 dark:text-error-400"}`}>
                          {formatCurrency(line.balance)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {data.lines.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No transactions found for this period.</p>
              </div>
            )}

            {/* Closing Balance Footer */}
            <div className="border-t-2 border-brand-300 bg-brand-50/50 px-4 py-4 dark:border-brand-800 dark:bg-brand-900/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-brand-700 dark:text-brand-300">
                  Closing Balance
                </span>
                <span className="text-sm font-bold tabular-nums text-brand-700 dark:text-brand-300">
                  {formatCurrency(data.closingBalance)}
                </span>
              </div>
              {data.lines.length > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {data.lines.length} transaction{data.lines.length !== 1 ? "s" : ""} in this period
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-12 text-center dark:border-gray-700 dark:bg-gray-900/60">
          <svg className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Select an account and click Generate to view the ledger.
          </p>
        </div>
      )}
    </div>
  );
};

export default AccountLedgerReport;
