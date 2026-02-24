"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import journalEntriesService from "@/services/journalEntriesService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { JournalEntry, JournalEntryType, RecurringFrequency } from "@/types/journalEntries";

interface EntryLine {
  key: string;
  accountId: string;
  debit: number;
  credit: number;
  description: string;
}

interface EditJournalEntryModalProps {
  isOpen: boolean;
  entryId: string | null;
  onClose: () => void;
  onUpdated: () => void;
  accounts: { id: string; name: string; accountNumber: string }[];
}

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

function generateKey(): string {
  return Math.random().toString(36).substring(2, 10);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const ENTRY_TYPE_OPTIONS: { value: JournalEntryType; label: string }[] = [
  { value: "STANDARD", label: "Standard" },
  { value: "ADJUSTING", label: "Adjusting" },
  { value: "CLOSING", label: "Closing" },
  { value: "REVERSING", label: "Reversing" },
  { value: "RECURRING", label: "Recurring" },
];

const EditJournalEntryModal: React.FC<EditJournalEntryModalProps> = ({
  isOpen,
  entryId,
  onClose,
  onUpdated,
  accounts,
}) => {
  const { token } = useAuth();

  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [entryNumber, setEntryNumber] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [entryType, setEntryType] = useState<JournalEntryType>("STANDARD");
  const [description, setDescription] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Lines
  const [lines, setLines] = useState<EntryLine[]>([]);

  // Recurring
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("");
  const [recurringEndDate, setRecurringEndDate] = useState("");

  // Auto-Reversing
  const [isAutoReversing, setIsAutoReversing] = useState(false);
  const [reversalDate, setReversalDate] = useState("");

  const populateForm = useCallback((entry: JournalEntry) => {
    setEntryNumber(entry.entryNumber);
    setEntryDate(entry.entryDate);
    setEntryType(entry.entryType);
    setDescription(entry.description || "");
    setReferenceNumber(entry.referenceNumber || "");
    setNotes(entry.notes || "");
    setIsRecurring(entry.isRecurring);
    setRecurringFrequency(entry.recurringFrequency || "");
    setRecurringEndDate(entry.recurringEndDate || "");
    setIsAutoReversing(entry.isAutoReversing);
    setReversalDate(entry.reversalDate || "");

    if (entry.lines.length > 0) {
      setLines(
        entry.lines.map((l) => ({
          key: generateKey(),
          accountId: l.account.id,
          debit: l.debit,
          credit: l.credit,
          description: l.description || "",
        }))
      );
    } else {
      setLines([
        { key: generateKey(), accountId: "", debit: 0, credit: 0, description: "" },
        { key: generateKey(), accountId: "", debit: 0, credit: 0, description: "" },
      ]);
    }
  }, []);

  useEffect(() => {
    if (isOpen && entryId && token) {
      setLoadingData(true);
      setError("");
      journalEntriesService
        .getJournalEntry(entryId, token)
        .then((data) => populateForm(data))
        .catch((err) => setError(formatApiErrorMessage(err)))
        .finally(() => setLoadingData(false));
    }
  }, [isOpen, entryId, token, populateForm]);

  // Totals
  const totalDebit = useMemo(() => lines.reduce((sum, l) => sum + l.debit, 0), [lines]);
  const totalCredit = useMemo(() => lines.reduce((sum, l) => sum + l.credit, 0), [lines]);
  const difference = totalDebit - totalCredit;
  const isBalanced = Math.abs(difference) < 0.01;

  // Line helpers
  const addLine = () => {
    setLines((prev) => [...prev, { key: generateKey(), accountId: "", debit: 0, credit: 0, description: "" }]);
  };

  const removeLine = (key: string) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const updateLine = (key: string, field: keyof EntryLine, value: string | number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const updated = { ...l, [field]: value };
        if (field === "debit" && (value as number) > 0) {
          updated.credit = 0;
        } else if (field === "credit" && (value as number) > 0) {
          updated.debit = 0;
        }
        return updated;
      })
    );
  };

  const handleSave = async () => {
    if (!token || !entryId) return;

    if (!entryDate) {
      setError("Entry date is required.");
      return;
    }
    if (lines.length < 2) {
      setError("At least 2 lines are required.");
      return;
    }

    const validLines = lines.filter((l) => l.accountId && (l.debit > 0 || l.credit > 0));
    if (validLines.length < 2) {
      setError("At least 2 lines with an account and amount are required.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      await journalEntriesService.updateJournalEntry(
        entryId,
        {
          entryDate,
          entryNumber: entryNumber || undefined,
          description: description || undefined,
          referenceNumber: referenceNumber || undefined,
          notes: notes || undefined,
          entryType,
          isRecurring: isRecurring || undefined,
          recurringFrequency: isRecurring ? (recurringFrequency as RecurringFrequency) || undefined : undefined,
          recurringEndDate: isRecurring && recurringEndDate ? recurringEndDate : undefined,
          isAutoReversing: isAutoReversing || undefined,
          reversalDate: isAutoReversing && reversalDate ? reversalDate : undefined,
          lines: validLines.map((l, i) => ({
            accountId: l.accountId,
            debit: l.debit > 0 ? l.debit : undefined,
            credit: l.credit > 0 ? l.credit : undefined,
            description: l.description || undefined,
            sortOrder: i + 1,
          })),
        },
        token
      );
      onUpdated();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Edit Journal Entry
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Modify entry {entryNumber}
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span className="ml-2 text-sm text-gray-500">Loading entry...</span>
        </div>
      ) : (
        <>
          <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
            {/* Header Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Entry Number</Label>
                <Input type="text" value={entryNumber} onChange={(e) => setEntryNumber(e.target.value)} />
              </div>
              <div>
                <Label>Entry Date <span className="text-error-500">*</span></Label>
                <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
              </div>
              <div>
                <Label>Entry Type</Label>
                <select value={entryType} onChange={(e) => setEntryType(e.target.value as JournalEntryType)} className={selectClasses}>
                  {ENTRY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Reference #</Label>
                <Input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <TextArea value={description} onChange={(val) => setDescription(val)} placeholder="Purpose of this journal entry" rows={2} />
            </div>

            {/* Debit/Credit Lines */}
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Entry Lines
                </h3>
                <Button variant="outline" size="sm" onClick={addLine}>+ Add Line</Button>
              </div>

              {/* Lines Header */}
              <div className="mb-2 grid grid-cols-12 gap-2 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                <div className="col-span-4">Account</div>
                <div className="col-span-2 text-right">Debit</div>
                <div className="col-span-2 text-right">Credit</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-1"></div>
              </div>

              <div className="space-y-2">
                {lines.map((line) => (
                  <div key={line.key} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 p-2 dark:border-gray-700 dark:bg-gray-800/30">
                    <div className="col-span-4">
                      <select
                        value={line.accountId}
                        onChange={(e) => updateLine(line.key, "accountId", e.target.value)}
                        className="h-9 w-full appearance-none rounded-lg border border-gray-300 px-2 text-xs shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      >
                        <option value="">Select account</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.accountNumber} — {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={line.debit || ""}
                        onChange={(e) => updateLine(line.key, "debit", parseFloat(e.target.value) || 0)}
                        step={0.01}
                        min={0}
                        placeholder="0.00"
                        className="h-9 w-full rounded-lg border border-gray-300 px-2 text-xs text-right tabular-nums shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={line.credit || ""}
                        onChange={(e) => updateLine(line.key, "credit", parseFloat(e.target.value) || 0)}
                        step={0.01}
                        min={0}
                        placeholder="0.00"
                        className="h-9 w-full rounded-lg border border-gray-300 px-2 text-xs text-right tabular-nums shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => updateLine(line.key, "description", e.target.value)}
                        placeholder="Description"
                        className="h-9 w-full rounded-lg border border-gray-300 px-2 text-xs shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        disabled={lines.length <= 2}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        title="Remove"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4H14M5.333 4V2.667C5.333 2.313 5.474 1.974 5.724 1.724C5.974 1.474 6.313 1.333 6.667 1.333H9.333C9.687 1.333 10.026 1.474 10.276 1.724C10.526 1.974 10.667 2.313 10.667 2.667V4M12.667 4V13.333C12.667 13.687 12.526 14.026 12.276 14.276C12.026 14.526 11.687 14.667 11.333 14.667H4.667C4.313 14.667 3.974 14.526 3.724 14.276C3.474 14.026 3.333 13.687 3.333 13.333V4H12.667Z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Running Totals Footer */}
              <div className={`mt-3 rounded-lg border p-3 ${isBalanced ? "border-success-200 bg-success-50/50 dark:border-success-800 dark:bg-success-900/10" : "border-error-200 bg-error-50/50 dark:border-error-800 dark:bg-error-900/10"}`}>
                <div className="grid grid-cols-12 gap-2 text-sm">
                  <div className="col-span-4 font-medium text-gray-700 dark:text-gray-300">Totals</div>
                  <div className={`col-span-2 text-right font-bold tabular-nums ${isBalanced ? "text-success-700 dark:text-success-300" : "text-gray-900 dark:text-white"}`}>
                    {formatCurrency(totalDebit)}
                  </div>
                  <div className={`col-span-2 text-right font-bold tabular-nums ${isBalanced ? "text-success-700 dark:text-success-300" : "text-gray-900 dark:text-white"}`}>
                    {formatCurrency(totalCredit)}
                  </div>
                  <div className="col-span-4">
                    <span className={`text-xs font-medium ${isBalanced ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400"}`}>
                      {isBalanced ? "Balanced" : `Difference: ${formatCurrency(Math.abs(difference))}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recurring Section */}
            {entryType === "RECURRING" && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-4 dark:border-teal-800 dark:bg-teal-900/10">
                <h4 className="mb-3 text-sm font-semibold text-teal-700 dark:text-teal-300">Recurring Schedule</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Frequency</Label>
                    <select value={recurringFrequency} onChange={(e) => setRecurringFrequency(e.target.value)} className={selectClasses}>
                      <option value="">Select frequency</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="BIWEEKLY">Bi-Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input type="date" value={recurringEndDate} onChange={(e) => setRecurringEndDate(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Auto-Reversing Section */}
            {entryType === "ADJUSTING" && (
              <div className="rounded-xl border border-purple-200 bg-purple-50/30 p-4 dark:border-purple-800 dark:bg-purple-900/10">
                <div className="flex items-center gap-3 mb-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
                    <input
                      type="checkbox"
                      checked={isAutoReversing}
                      onChange={(e) => setIsAutoReversing(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    Auto-Reversing Entry
                  </label>
                </div>
                {isAutoReversing && (
                  <div className="max-w-xs">
                    <Label>Reversal Date</Label>
                    <Input type="date" value={reversalDate} onChange={(e) => setReversalDate(e.target.value)} />
                    <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                      A reversal draft with flipped debits/credits will be auto-created when this entry is posted.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <TextArea value={notes} onChange={(val) => setNotes(val)} placeholder="Internal notes..." rows={2} />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default EditJournalEntryModal;
