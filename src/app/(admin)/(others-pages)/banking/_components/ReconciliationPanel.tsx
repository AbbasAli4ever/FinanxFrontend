"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import bankingService from "@/services/bankingService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { BankAccount, BankReconciliation, BankTransaction } from "@/types/banking";

interface Props {
  account: BankAccount;
  onClose: () => void;
}

type Phase = "start" | "clearing" | "complete";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function TxnRow({
  txn,
  checked,
  onToggle,
}: {
  txn: BankTransaction;
  checked: boolean;
  onToggle: () => void;
}) {
  const isCredit = txn.amount > 0;
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
      checked
        ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20"
        : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900"
    }`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 rounded border-gray-300 text-brand-600 accent-brand-600"
      />
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{txn.description}</p>
        <p className="text-xs text-gray-400">
          {formatDate(txn.date)} · {txn.type}
          {txn.checkNumber && ` · Chk #${txn.checkNumber}`}
        </p>
      </div>
      <span className={`flex-shrink-0 text-sm font-bold tabular-nums ${
        isCredit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
      }`}>
        {isCredit ? "+" : "-"}{formatCurrency(Math.abs(txn.amount))}
      </span>
    </label>
  );
}

const ReconciliationPanel: React.FC<Props> = ({ account, onClose }) => {
  const { token } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const [phase, setPhase] = useState<Phase>("start");
  const [statementDate, setStatementDate] = useState(today);
  const [statementBalance, setStatementBalance] = useState("");
  const [startLoading, setStartLoading] = useState(false);
  const [startError, setStartError] = useState("");

  const [recon, setRecon] = useState<BankReconciliation | null>(null);
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const [completedResult, setCompletedResult] = useState<{ clearedCount: number; statementBalance: number } | null>(null);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const bal = parseFloat(statementBalance);
    if (isNaN(bal)) { setStartError("Enter a valid statement balance."); return; }

    setStartLoading(true);
    setStartError("");
    try {
      const data = await bankingService.startReconciliation(account.id, {
        statementDate,
        statementBalance: bal,
      }, token);
      setRecon(data);
      // Pre-populate any already-cleared transactions from the response
      const preCleared = new Set(data.clearedTransactions?.map((t) => t.id) ?? []);
      setClearedIds(preCleared);
      setPhase("clearing");
    } catch (err) {
      setStartError(formatApiErrorMessage(err));
    } finally {
      setStartLoading(false);
    }
  };

  const toggleCleared = (txnId: string) => {
    setClearedIds((prev) => {
      const next = new Set(prev);
      if (next.has(txnId)) next.delete(txnId);
      else next.add(txnId);
      return next;
    });
  };

  const allTxns: BankTransaction[] = [
    ...(recon?.unreconciledTransactions ?? []),
    ...(recon?.clearedTransactions ?? []),
  ];

  const clearedTxns = allTxns.filter((t) => clearedIds.has(t.id));
  const unclearedTxns = allTxns.filter((t) => !clearedIds.has(t.id));

  const openingBalance = recon?.openingBalance ?? 0;
  const statBal = recon?.statementBalance ?? 0;
  const clearedSum = clearedTxns.reduce((s, t) => s + t.amount, 0);
  const clearedBalance = openingBalance + clearedSum;
  const difference = statBal - clearedBalance;
  const isBalanced = Math.abs(difference) < 0.01;

  const handleComplete = async () => {
    if (!token || !recon) return;
    setCompleteLoading(true);
    setCompleteError("");
    try {
      const result = await bankingService.completeReconciliation(recon.id, {
        clearedTransactionIds: Array.from(clearedIds),
      }, token);
      setCompletedResult({ clearedCount: result.clearedCount, statementBalance: result.statementBalance });
      setPhase("complete");
    } catch (err) {
      setCompleteError(formatApiErrorMessage(err));
    } finally {
      setCompleteLoading(false);
    }
  };

  if (phase === "complete" && completedResult) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Reconciliation Complete!</h3>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            <span className="font-bold text-green-600">{completedResult.clearedCount}</span> transactions cleared for{" "}
            <span className="font-bold">{account.name}</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">Statement Balance: {formatCurrency(completedResult.statementBalance)}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-xl bg-brand-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Close
        </button>
      </div>
    );
  }

  if (phase === "start") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Start Reconciliation</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Reconciling <span className="font-medium text-gray-700 dark:text-gray-300">{account.name}</span> — Current system balance:{" "}
            <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(account.currentBalance)}</span>
          </p>
        </div>

        <form onSubmit={handleStart} className="flex flex-col gap-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-800/50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Statement Date *
                </label>
                <input
                  type="date"
                  value={statementDate}
                  onChange={(e) => setStatementDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Statement Ending Balance *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">$</span>
                  <input
                    type="number"
                    value={statementBalance}
                    onChange={(e) => setStatementBalance(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-7 pr-3 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/10">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>Note:</strong> Only one reconciliation session can be active at a time per account.
              The opening balance is determined from the last completed reconciliation.
            </p>
          </div>

          {startError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {startError}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={startLoading} className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
              {startLoading ? "Starting..." : "Start Reconciliation"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Clearing phase
  return (
    <div className="flex flex-col gap-5">
      {/* Header with live difference */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Clear Transactions</h3>
          <p className="text-sm text-gray-500">
            {account.name} · Statement date: <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(recon?.statementDate ?? "")}</span>
          </p>
        </div>
        {/* Running totals */}
        <div className="grid grid-cols-3 gap-3 text-center sm:text-right">
          {[
            { label: "Opening Balance", val: openingBalance, cls: "text-gray-900 dark:text-white" },
            { label: "Cleared Balance", val: clearedBalance, cls: "text-gray-900 dark:text-white" },
            {
              label: "Difference",
              val: difference,
              cls: isBalanced
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400",
            },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl border p-3 ${
              stat.label === "Difference"
                ? isBalanced
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10"
                  : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10"
                : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50"
            }`}>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={`text-base font-bold tabular-nums ${stat.cls}`}>{formatCurrency(stat.val)}</p>
              {stat.label === "Difference" && (
                <p className="text-[10px] text-gray-400">
                  Target: {formatCurrency(statBal)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {isBalanced && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-900/10">
          <svg className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            Accounts balanced! You can now complete reconciliation.
          </p>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Uncleared */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Uncleared ({unclearedTxns.length})</h4>
            {unclearedTxns.length > 0 && (
              <button
                onClick={() => setClearedIds(new Set(allTxns.map((t) => t.id)))}
                className="text-xs text-brand-600 hover:underline dark:text-brand-400"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
            {unclearedTxns.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">All transactions cleared</p>
            ) : (
              unclearedTxns.map((txn) => (
                <TxnRow key={txn.id} txn={txn} checked={false} onToggle={() => toggleCleared(txn.id)} />
              ))
            )}
          </div>
        </div>

        {/* Cleared */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Cleared ({clearedTxns.length})
              <span className="ml-2 text-xs font-normal text-gray-400">
                Sum: {formatCurrency(clearedSum)}
              </span>
            </h4>
            {clearedTxns.length > 0 && (
              <button
                onClick={() => setClearedIds(new Set())}
                className="text-xs text-gray-500 hover:underline dark:text-gray-400"
              >
                Unclear all
              </button>
            )}
          </div>
          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
            {clearedTxns.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">No transactions cleared yet</p>
            ) : (
              clearedTxns.map((txn) => (
                <TxnRow key={txn.id} txn={txn} checked={true} onToggle={() => toggleCleared(txn.id)} />
              ))
            )}
          </div>
        </div>
      </div>

      {completeError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {completeError}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
        <button onClick={onClose} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
          Cancel
        </button>
        <button
          onClick={handleComplete}
          disabled={!isBalanced || completeLoading}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          title={!isBalanced ? `Difference must be 0 (currently ${formatCurrency(difference)})` : ""}
        >
          {completeLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Completing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Complete Reconciliation
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReconciliationPanel;
