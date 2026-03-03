"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import bankingService from "@/services/bankingService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { BankAccount, BankTransactionType } from "@/types/banking";

interface Props {
  isOpen: boolean;
  account: BankAccount | null;
  onClose: () => void;
  onCreated: () => void;
}

const TYPE_OPTIONS: { label: string; value: BankTransactionType; sign: "+" | "-" | "±" }[] = [
  { label: "Deposit", value: "DEPOSIT", sign: "+" },
  { label: "Withdrawal", value: "WITHDRAWAL", sign: "-" },
  { label: "Transfer", value: "TRANSFER", sign: "±" },
  { label: "Bank Fee", value: "FEE", sign: "-" },
  { label: "Interest", value: "INTEREST", sign: "+" },
  { label: "Check", value: "CHECK", sign: "-" },
  { label: "Other", value: "OTHER", sign: "±" },
];

const ManualTransactionModal: React.FC<Props> = ({ isOpen, account, onClose, onCreated }) => {
  const { token } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [type, setType] = useState<BankTransactionType>("OTHER");
  const [checkNumber, setCheckNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isCredit, setIsCredit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedTypeInfo = TYPE_OPTIONS.find((t) => t.value === type);

  const handleTypeChange = (val: BankTransactionType) => {
    setType(val);
    const info = TYPE_OPTIONS.find((t) => t.value === val);
    if (info?.sign === "+") setIsCredit(true);
    if (info?.sign === "-") setIsCredit(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !account) return;
    const rawAmount = parseFloat(amountStr);
    if (isNaN(rawAmount) || rawAmount <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }
    const amount = isCredit ? rawAmount : -rawAmount;

    setLoading(true);
    setError("");
    try {
      await bankingService.createTransaction(account.id, {
        date,
        description: description.trim(),
        amount,
        type,
        ...(checkNumber.trim() ? { checkNumber: checkNumber.trim() } : {}),
        ...(referenceNumber.trim() ? { referenceNumber: referenceNumber.trim() } : {}),
      }, token);
      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDate(today);
    setDescription("");
    setAmountStr("");
    setType("OTHER");
    setCheckNumber("");
    setReferenceNumber("");
    setIsCredit(true);
    setError("");
  };

  const handleClose = () => { resetForm(); onClose(); };

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">
              <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Transaction</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{account.name}</p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className="col-span-1">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Type */}
            <div className="col-span-1">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as BankTransactionType)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label} ({o.sign})</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Office supplies from Staples"
                required
                maxLength={500}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-600"
              />
            </div>

            {/* Amount + direction toggle */}
            <div className="col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount *</label>
              <div className="flex gap-2">
                {/* Credit / Debit toggle */}
                <div className="flex overflow-hidden rounded-xl border border-gray-300 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setIsCredit(true)}
                    className={`px-3 py-2.5 text-sm font-medium transition-colors ${
                      isCredit
                        ? "bg-green-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
                    }`}
                  >
                    + Credit
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCredit(false)}
                    className={`px-3 py-2.5 text-sm font-medium transition-colors ${
                      !isCredit
                        ? "bg-red-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
                    }`}
                  >
                    − Debit
                  </button>
                </div>
                <div className="relative flex-1">
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
              {selectedTypeInfo && selectedTypeInfo.sign !== "±" && (
                <p className="mt-1 text-xs text-gray-400">
                  {selectedTypeInfo.label} will be stored as a {selectedTypeInfo.sign === "+" ? "positive (credit)" : "negative (debit)"} amount.
                </p>
              )}
            </div>

            {/* Check Number (for CHECK type) */}
            {type === "CHECK" && (
              <div className="col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Check #</label>
                <input
                  type="text"
                  value={checkNumber}
                  onChange={(e) => setCheckNumber(e.target.value)}
                  placeholder="1001"
                  maxLength={50}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            )}

            {/* Reference Number */}
            <div className={type === "CHECK" ? "col-span-1" : "col-span-2"}>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Reference #</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="REF-001"
                maxLength={100}
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
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? "Adding..." : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualTransactionModal;
