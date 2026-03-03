"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import bankingService from "@/services/bankingService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { BankTransaction } from "@/types/banking";

interface Props {
  isOpen: boolean;
  transaction: BankTransaction | null;
  onClose: () => void;
  onMatched: () => void;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(n));
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const MatchTransactionModal: React.FC<Props> = ({ isOpen, transaction, onClose, onMatched }) => {
  const { token } = useAuth();
  const [journalEntryId, setJournalEntryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !transaction || !journalEntryId.trim()) return;
    setLoading(true);
    setError("");
    try {
      await bankingService.matchTransaction(transaction.id, { journalEntryId: journalEntryId.trim() }, token);
      setJournalEntryId("");
      onMatched();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setJournalEntryId("");
    setError("");
    onClose();
  };

  if (!isOpen || !transaction) return null;
  const isCredit = transaction.amount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">
              <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Match to Journal Entry</h2>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Transaction info */}
        <div className="border-b border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-800/50">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Bank Transaction</p>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{transaction.description}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(transaction.date)} · {transaction.type}
                {transaction.checkNumber && ` · Check #${transaction.checkNumber}`}
              </p>
            </div>
            <span className={`text-lg font-bold tabular-nums ${
              isCredit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}>
              {isCredit ? "+" : "-"}{formatCurrency(transaction.amount)}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Journal Entry ID
            </label>
            <input
              type="text"
              value={journalEntryId}
              onChange={(e) => setJournalEntryId(e.target.value)}
              placeholder="Paste the Journal Entry UUID..."
              required
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-600"
            />
            <p className="mt-1.5 text-xs text-gray-400">
              The journal entry must be POSTED and have at least one line referencing this bank account.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !journalEntryId.trim()}
              className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? "Matching..." : "Match Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchTransactionModal;
