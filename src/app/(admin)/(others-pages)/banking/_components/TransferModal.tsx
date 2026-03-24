"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import bankingService from "@/services/bankingService";
import AppDatePicker from "@/components/form/AppDatePicker";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { BankAccount, TransferResult } from "@/types/banking";

interface Props {
  isOpen: boolean;
  accounts: BankAccount[];
  defaultSourceId?: string;
  onClose: () => void;
  onTransferred: () => void;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

const TransferModal: React.FC<Props> = ({
  isOpen,
  accounts,
  defaultSourceId,
  onClose,
  onTransferred,
}) => {
  const { token } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const [sourceId, setSourceId] = useState(defaultSourceId ?? accounts[0]?.id ?? "");
  const [destinationId, setDestinationId] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TransferResult | null>(null);

  const sourceAccount = accounts.find((a) => a.id === sourceId);
  const destinationAccounts = accounts.filter((a) => a.id !== sourceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !sourceId || !destinationId) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) { setError("Enter a valid positive amount."); return; }

    setLoading(true);
    setError("");
    try {
      const res = await bankingService.transfer(sourceId, {
        destinationAccountId: destinationId,
        amount,
        date,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(referenceNumber.trim() ? { referenceNumber: referenceNumber.trim() } : {}),
      }, token);
      setResult(res);
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSourceId(defaultSourceId ?? accounts[0]?.id ?? "");
    setDestinationId("");
    setAmountStr("");
    setDate(today);
    setDescription("");
    setReferenceNumber("");
    setError("");
    setResult(null);
  };

  const handleClose = () => { resetForm(); onClose(); };
  const handleDone = () => { resetForm(); onTransferred(); onClose(); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
              <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transfer Funds</h2>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success result */}
        {result ? (
          <div className="flex flex-col items-center gap-5 p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Transfer Complete</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {formatCurrency(result.amount)} transferred on {result.date}
              </p>
            </div>
            <div className="w-full rounded-xl border border-gray-200 dark:border-gray-800">
              {[
                { label: result.sourceAccount.name, sub: "Source", bal: result.sourceAccount.newBalance },
                { label: result.destinationAccount.name, sub: "Destination", bal: result.destinationAccount.newBalance },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-0 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{row.label}</p>
                    <p className="text-xs text-gray-500">{row.sub}</p>
                  </div>
                  <p className="font-bold tabular-nums text-gray-900 dark:text-white">{formatCurrency(row.bal)}</p>
                </div>
              ))}
            </div>
            <button onClick={handleDone} className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5">
            <div className="grid grid-cols-2 gap-4">
              {/* Source account */}
              <div className="col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">From Account *</label>
                <select
                  value={sourceId}
                  onChange={(e) => { setSourceId(e.target.value); setDestinationId(""); }}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {formatCurrency(a.currentBalance)}
                    </option>
                  ))}
                </select>
                {sourceAccount && (
                  <p className="mt-1 text-xs text-gray-400">
                    Available: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(sourceAccount.currentBalance)}</span>
                  </p>
                )}
              </div>

              {/* Destination account */}
              <div className="col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">To Account *</label>
                <select
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Select destination account...</option>
                  {destinationAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {formatCurrency(a.currentBalance)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Arrow indicator */}
              {sourceId && destinationId && (
                <div className="col-span-2 flex items-center justify-center gap-3 rounded-xl bg-indigo-50 py-2.5 dark:bg-indigo-900/10">
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    {accounts.find((a) => a.id === sourceId)?.name}
                  </span>
                  <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    {accounts.find((a) => a.id === destinationId)?.name}
                  </span>
                </div>
              )}

              {/* Amount */}
              <div className="col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">$</span>
                  <input
                    type="number"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-7 pr-3 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Date *</label>
                <AppDatePicker
                  value={date}
                  onChange={(val) => setDate(val)}
                  maxToday
                />
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Monthly savings transfer"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* Reference number */}
              <div className="col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Reference #</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="TRF-001"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={handleClose} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                {loading ? "Transferring..." : "Transfer Funds"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TransferModal;
