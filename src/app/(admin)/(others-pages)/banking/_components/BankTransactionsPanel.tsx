"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import bankingService from "@/services/bankingService";
import AppDatePicker from "@/components/form/AppDatePicker";
import { formatApiErrorMessage } from "@/utils/apiError";
import type {
  BankAccount,
  BankTransaction,
  BankTransactionStatus,
  BankTransactionType,
  TransactionFilters,
} from "@/types/banking";

interface Props {
  account: BankAccount;
  onAddManual: () => void;
  onMatch: (txn: BankTransaction) => void;
  onImport: () => void;
  onReconcile: () => void;
  refreshTrigger: number;
  onUnmatchedChange: (accountId: string, count: number) => void;
}

const STATUS_OPTIONS: { label: string; value: BankTransactionStatus | "" }[] = [
  { label: "All Status", value: "" },
  { label: "Unmatched", value: "UNMATCHED" },
  { label: "Matched", value: "MATCHED" },
  { label: "Excluded", value: "EXCLUDED" },
];

const TYPE_OPTIONS: { label: string; value: BankTransactionType | "" }[] = [
  { label: "All Types", value: "" },
  { label: "Deposit", value: "DEPOSIT" },
  { label: "Withdrawal", value: "WITHDRAWAL" },
  { label: "Transfer", value: "TRANSFER" },
  { label: "Fee", value: "FEE" },
  { label: "Interest", value: "INTEREST" },
  { label: "Check", value: "CHECK" },
  { label: "Other", value: "OTHER" },
];

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(n));
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: BankTransactionStatus }) {
  const cfg = {
    UNMATCHED: { label: "Unmatched", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" },
    MATCHED: { label: "Matched", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", dot: "bg-green-500" },
    EXCLUDED: { label: "Excluded", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", dot: "bg-gray-400" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }: { type: BankTransactionType }) {
  const map: Record<BankTransactionType, string> = {
    DEPOSIT: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    WITHDRAWAL: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    TRANSFER: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
    FEE: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    INTEREST: "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400",
    CHECK: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    OTHER: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${map[type] ?? map.OTHER}`}>
      {type}
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

const BankTransactionsPanel: React.FC<Props> = ({
  account,
  onAddManual,
  onMatch,
  onImport,
  onReconcile,
  refreshTrigger,
  onUnmatchedChange,
}) => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [unmatchingId, setUnmatchingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BankTransactionStatus | "">("");
  const [type, setType] = useState<BankTransactionType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchTransactions = useCallback((pg = 1) => {
    if (!token || !account.id) return;
    setLoading(true);
    const filters: TransactionFilters = {
      page: String(pg),
      limit: String(PAGE_SIZE),
    };
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (search) filters.search = search;

    bankingService
      .getTransactions(account.id, filters, token)
      .then((data) => {
        setTransactions(data.items ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotalCount(data.pagination?.total ?? 0);
        // Update unmatched count to parent
        const unmatched = (data.items ?? []).filter((t) => t.status === "UNMATCHED").length;
        onUnmatchedChange(account.id, unmatched);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, account.id, status, type, startDate, endDate, search, onUnmatchedChange]);

  useEffect(() => {
    setPage(1);
    fetchTransactions(1);
  }, [fetchTransactions, refreshTrigger]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { setPage(1); }, 400);
  };

  const handlePageChange = (pg: number) => { setPage(pg); fetchTransactions(pg); };

  const clearFilters = () => {
    setSearch(""); setStatus(""); setType(""); setStartDate(""); setEndDate("");
    setPage(1);
  };

  const hasFilters = !!(search || status || type || startDate || endDate);

  const handleDelete = async () => {
    if (!token || !deleteId) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await bankingService.deleteTransaction(deleteId, token);
      setDeleteId(null);
      fetchTransactions(page);
    } catch (e) {
      setDeleteError(formatApiErrorMessage(e));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUnmatch = async (txnId: string) => {
    if (!token) return;
    setUnmatchingId(txnId);
    setActionError("");
    try {
      await bankingService.unmatchTransaction(txnId, token);
      fetchTransactions(page);
    } catch (e) {
      setActionError(formatApiErrorMessage(e));
    } finally {
      setUnmatchingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Panel header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {account.name}
            {account.accountNumberLast4 && (
              <span className="ml-2 text-sm font-normal text-gray-400">····{account.accountNumberLast4}</span>
            )}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {account.institutionName ?? account.detailType} · {totalCount} transactions
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onAddManual}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add
          </button>
          <button
            onClick={onImport}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Import CSV
          </button>
          <button
            onClick={onReconcile}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            Reconcile
          </button>
        </div>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {actionError}
        </div>
      )}

      {/* Filters row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {/* Search */}
        <div className="relative col-span-2 sm:col-span-2">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search description, ref, check #..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as BankTransactionStatus | ""); setPage(1); }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          value={type}
          onChange={(e) => { setType(e.target.value as BankTransactionType | ""); setPage(1); }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <AppDatePicker
          value={startDate}
          onChange={(val) => { setStartDate(val); setPage(1); }}
          maxToday
          max={endDate}
        />

        <div className="flex gap-1">
          <AppDatePicker
            value={endDate}
            onChange={(val) => { setEndDate(val); setPage(1); }}
            min={startDate}
            maxToday
          />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex-shrink-0 rounded-lg border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
              title="Clear filters"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                {["Date", "Description", "Type", "Check #", "Amount", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-14 dark:border-gray-700">
          <svg className="h-12 w-12 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">No transactions found</p>
          <div className="mt-2 flex gap-2">
            <button onClick={onAddManual} className="text-xs font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400">Add manually</button>
            <span className="text-xs text-gray-400">or</span>
            <button onClick={onImport} className="text-xs font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400">Import CSV</button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Ref / Check</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {transactions.map((txn) => {
                  const isCredit = txn.amount > 0;
                  return (
                    <tr key={txn.id} className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {formatDate(txn.date)}
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="truncate font-medium text-gray-900 dark:text-white" title={txn.description}>
                          {txn.description}
                        </p>
                        {txn.matchedJournalEntry && (
                          <p className="text-[11px] text-green-600 dark:text-green-400">
                            → {txn.matchedJournalEntry.entryNumber}
                          </p>
                        )}
                        {txn.reconciled && (
                          <span className="text-[10px] font-semibold text-gray-400">RECONCILED</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <TypeBadge type={txn.type} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {txn.checkNumber && <p>Chk #{txn.checkNumber}</p>}
                        {txn.referenceNumber && <p>{txn.referenceNumber}</p>}
                        {!txn.checkNumber && !txn.referenceNumber && <span className="text-gray-300 dark:text-gray-700">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold tabular-nums ${
                          isCredit
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          {isCredit ? "+" : "-"}{formatCurrency(txn.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={txn.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {txn.status === "UNMATCHED" && !txn.reconciled && (
                            <button
                              onClick={() => onMatch(txn)}
                              className="rounded px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20"
                            >
                              Match
                            </button>
                          )}
                          {txn.status === "MATCHED" && !txn.reconciled && (
                            <button
                              onClick={() => handleUnmatch(txn.id)}
                              disabled={unmatchingId === txn.id}
                              className="rounded px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                            >
                              {unmatchingId === txn.id ? "..." : "Unmatch"}
                            </button>
                          )}
                          {!txn.reconciled && (
                            <button
                              onClick={() => setDeleteId(txn.id)}
                              className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              Delete
                            </button>
                          )}
                        </div>
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
          <p className="text-xs text-gray-400">{totalCount} transactions</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400"
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
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
                    pg === page
                      ? "bg-brand-600 text-white"
                      : "border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
                  }`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setDeleteId(null); setDeleteError(""); }} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Transaction</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure? This cannot be undone. Reconciled transactions cannot be deleted.
            </p>
            {deleteError && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{deleteError}</p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => { setDeleteId(null); setDeleteError(""); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankTransactionsPanel;
