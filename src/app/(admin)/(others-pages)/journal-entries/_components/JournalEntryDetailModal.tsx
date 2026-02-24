"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import journalEntriesService from "@/services/journalEntriesService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { JournalEntry, JournalEntryStatus, JournalEntryType, JournalEntryStatusInfo } from "@/types/journalEntries";

interface JournalEntryDetailModalProps {
  isOpen: boolean;
  entryId: string | null;
  statusMap: Record<string, JournalEntryStatusInfo>;
  onClose: () => void;
  onEdit: (id: string) => void;
  onPost: (id: string, entryNumber: string, totalDebit: number, totalCredit: number) => void;
  onVoid: (id: string, entryNumber: string) => void;
  onReverse: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string, entryNumber: string) => void;
}

const STATUS_BADGE_COLOR: Record<JournalEntryStatus, "success" | "light" | "dark"> = {
  DRAFT: "light",
  POSTED: "success",
  VOID: "dark",
};

const TYPE_BADGE_COLOR: Record<JournalEntryType, "light" | "warning" | "info" | "error" | "primary"> = {
  STANDARD: "light",
  ADJUSTING: "warning",
  CLOSING: "info",
  REVERSING: "error",
  RECURRING: "primary",
};

const TYPE_LABELS: Record<JournalEntryType, string> = {
  STANDARD: "Standard",
  ADJUSTING: "Adjusting",
  CLOSING: "Closing",
  REVERSING: "Reversing",
  RECURRING: "Recurring",
};

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const JournalEntryDetailModal: React.FC<JournalEntryDetailModalProps> = ({
  isOpen,
  entryId,
  statusMap,
  onClose,
  onEdit,
  onPost,
  onVoid,
  onReverse,
  onDuplicate,
  onDelete,
}) => {
  const { token } = useAuth();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && entryId && token) {
      setLoading(true);
      setError("");
      journalEntriesService
        .getJournalEntry(entryId, token)
        .then((data) => setEntry(data))
        .catch((err) => setError(formatApiErrorMessage(err)))
        .finally(() => setLoading(false));
    } else {
      setEntry(null);
    }
  }, [isOpen, entryId, token]);

  if (!isOpen) return null;

  const si = entry ? statusMap[entry.status] : null;
  const isBalanced = entry ? Math.abs(entry.totalDebit - entry.totalCredit) < 0.01 : true;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl p-6 lg:p-8">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span className="ml-2 text-sm text-gray-500">Loading entry...</span>
        </div>
      ) : error ? (
        <Alert variant="error" title="Error" message={error} />
      ) : entry ? (
        <>
          {/* Header */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {entry.entryNumber}
                </h2>
                <Badge size="sm" color={STATUS_BADGE_COLOR[entry.status]} variant="light">
                  {si?.label || entry.status}
                </Badge>
                <Badge size="sm" color={TYPE_BADGE_COLOR[entry.entryType]} variant="light">
                  {TYPE_LABELS[entry.entryType]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {entry.description || "No description"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {si?.allowEdit && (
                <Button variant="outline" size="sm" onClick={() => { onClose(); onEdit(entry.id); }}>
                  Edit
                </Button>
              )}
              {si?.allowPost && (
                <Button size="sm" onClick={() => { onClose(); onPost(entry.id, entry.entryNumber, entry.totalDebit, entry.totalCredit); }}>
                  Post
                </Button>
              )}
              {si?.allowVoid && (
                <Button variant="outline" size="sm" onClick={() => { onClose(); onVoid(entry.id, entry.entryNumber); }}>
                  Void
                </Button>
              )}
              {si?.allowReverse && (
                <Button variant="outline" size="sm" onClick={() => { onClose(); onReverse(entry.id); }}>
                  Reverse
                </Button>
              )}
              {si?.allowDuplicate && (
                <Button variant="outline" size="sm" onClick={() => { onClose(); onDuplicate(entry.id); }}>
                  Duplicate
                </Button>
              )}
              {si?.allowDelete && (
                <Button variant="outline" size="sm" className="text-error-500 border-error-300 hover:bg-error-50" onClick={() => { onClose(); onDelete(entry.id, entry.entryNumber); }}>
                  Delete
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
            {/* Key Details Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(entry.entryDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Reference #</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {entry.referenceNumber || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Lines</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {entry.lines.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Created By</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {entry.createdBy.firstName} {entry.createdBy.lastName}
                </p>
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Totals</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Debits</p>
                  <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(entry.totalDebit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Credits</p>
                  <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(entry.totalCredit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Balance</p>
                  <p className={`text-lg font-bold tabular-nums ${isBalanced ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400"}`}>
                    {isBalanced ? "Balanced" : formatCurrency(Math.abs(entry.totalDebit - entry.totalCredit))}
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Flags */}
            <div className="flex flex-wrap gap-2">
              {entry.isRecurring && (
                <span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 dark:bg-teal-900/20 dark:text-teal-400">
                  Recurring
                  {entry.recurringFrequency ? ` — ${FREQUENCY_LABELS[entry.recurringFrequency] || entry.recurringFrequency}` : ""}
                </span>
              )}
              {entry.isAutoReversing && (
                <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                  Auto-Reversing
                  {entry.reversalDate ? ` on ${formatDate(entry.reversalDate)}` : ""}
                </span>
              )}
              {entry.reversedFrom && (
                <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                  Reversal of {entry.reversedFrom.entryNumber}
                </span>
              )}
            </div>

            {/* Recurring Info */}
            {entry.isRecurring && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-4 dark:border-teal-800 dark:bg-teal-900/10">
                <h3 className="mb-2 text-sm font-semibold text-teal-700 dark:text-teal-300">
                  Recurring Schedule
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-teal-600 dark:text-teal-400">Frequency</p>
                    <p className="text-sm font-medium text-teal-800 dark:text-teal-200">
                      {FREQUENCY_LABELS[entry.recurringFrequency || ""] || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-teal-600 dark:text-teal-400">Next Date</p>
                    <p className="text-sm font-medium text-teal-800 dark:text-teal-200">
                      {formatDate(entry.nextRecurringDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-teal-600 dark:text-teal-400">End Date</p>
                    <p className="text-sm font-medium text-teal-800 dark:text-teal-200">
                      {formatDate(entry.recurringEndDate)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Entry Lines Table */}
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Entry Lines
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">#</th>
                      <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">Account</th>
                      <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                      <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">Debit</th>
                      <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.lines
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((line, idx) => (
                        <tr key={line.id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2 text-gray-500 dark:text-gray-400">{idx + 1}</td>
                          <td className="py-2">
                            <div className="text-gray-900 dark:text-white/90">
                              {line.account.accountNumber ? `${line.account.accountNumber} — ` : ""}
                              {line.account.name}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {line.account.accountType}
                            </div>
                          </td>
                          <td className="py-2 text-gray-600 dark:text-gray-400">
                            {line.description || "—"}
                          </td>
                          <td className="py-2 text-right tabular-nums text-gray-900 dark:text-white/90">
                            {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                          </td>
                          <td className="py-2 text-right tabular-nums text-gray-900 dark:text-white/90">
                            {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                      <td colSpan={3} className="py-2 text-right font-semibold text-gray-700 dark:text-gray-300">
                        Totals
                      </td>
                      <td className={`py-2 text-right font-bold tabular-nums ${isBalanced ? "text-success-700 dark:text-success-300" : "text-gray-900 dark:text-white"}`}>
                        {formatCurrency(entry.totalDebit)}
                      </td>
                      <td className={`py-2 text-right font-bold tabular-nums ${isBalanced ? "text-success-700 dark:text-success-300" : "text-gray-900 dark:text-white"}`}>
                        {formatCurrency(entry.totalCredit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Timeline
              </h3>
              <div className="relative space-y-4 pl-6">
                <div className="absolute left-[9px] top-2 h-[calc(100%-16px)] w-px bg-gray-200 dark:bg-gray-700"></div>

                {/* Created */}
                <div className="relative">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"></div>
                  <p className="text-sm text-gray-900 dark:text-white">Created</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(entry.createdAt)} by {entry.createdBy.firstName} {entry.createdBy.lastName}
                  </p>
                </div>

                {/* Posted */}
                {entry.postedAt && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-success-400 bg-white dark:border-success-500 dark:bg-gray-900"></div>
                    <p className="text-sm text-gray-900 dark:text-white">Posted to Ledger</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(entry.postedAt)}
                      {entry.postedBy && ` by ${entry.postedBy.firstName} ${entry.postedBy.lastName}`}
                    </p>
                  </div>
                )}

                {/* Voided */}
                {entry.voidedAt && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-gray-500 bg-gray-200 dark:bg-gray-700"></div>
                    <p className="text-sm text-gray-900 dark:text-white">Voided</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(entry.voidedAt)}
                    </p>
                    {entry.voidReason && (
                      <p className="mt-1 rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {entry.voidReason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {entry.notes && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                  Notes
                </h3>
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800/40 dark:text-gray-400">
                  {entry.notes}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </>
      ) : null}
    </Modal>
  );
};

export default JournalEntryDetailModal;
