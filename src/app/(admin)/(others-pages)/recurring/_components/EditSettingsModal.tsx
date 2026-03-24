"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import AppDatePicker from "@/components/form/AppDatePicker";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import recurringService from "@/services/recurringService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { RecurringType, RecurringFrequency, AnyUpcomingItem } from "@/types/recurring";
import { FREQ_LABELS } from "./RecurringBadge";

const FREQUENCIES: RecurringFrequency[] = [
  "DAILY",
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
];

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

interface EditSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  item: AnyUpcomingItem | null;
}

function getDocNumber(item: AnyUpcomingItem): string {
  switch (item.type) {
    case "invoice": return item.invoiceNumber;
    case "bill": return item.billNumber;
    case "expense": return item.expenseNumber;
    case "journal-entry": return item.entryNumber;
  }
}

function getTypeName(type: RecurringType): string {
  switch (type) {
    case "invoice": return "Invoice";
    case "bill": return "Bill";
    case "expense": return "Expense";
    case "journal-entry": return "Journal Entry";
  }
}

const EditSettingsModal: React.FC<EditSettingsModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
  item,
}) => {
  const { token } = useAuth();
  const [frequency, setFrequency] = useState<RecurringFrequency>("MONTHLY");
  const [endDate, setEndDate] = useState("");
  const [noEndDate, setNoEndDate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item) {
      setFrequency((item.recurringFrequency as RecurringFrequency) ?? "MONTHLY");
      if (item.recurringEndDate) {
        setEndDate(item.recurringEndDate.split("T")[0]);
        setNoEndDate(false);
      } else {
        setEndDate("");
        setNoEndDate(true);
      }
      setError("");
    }
  }, [item]);

  const handleSubmit = async () => {
    if (!token || !item) return;
    setLoading(true);
    setError("");
    try {
      await recurringService.updateSettings(
        item.type as RecurringType,
        item.id,
        {
          recurringFrequency: frequency,
          recurringEndDate: noEndDate ? null : endDate || null,
        },
        token
      );
      onUpdated();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;
  const docNumber = getDocNumber(item);
  const typeName = getTypeName(item.type as RecurringType);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="space-y-5 p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Recurring Settings
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {typeName} <span className="font-mono font-semibold text-brand-600 dark:text-brand-400">{docNumber}</span>
            </p>
          </div>
          {/* Recurring icon badge */}
          <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Recurring
          </span>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        {/* Frequency */}
        <div>
          <Label>Recurrence Frequency</Label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
            className={selectClasses}
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {FREQ_LABELS[f]}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            Changing the frequency will recalculate the next due date.
          </p>
        </div>

        {/* No end date toggle */}
        <div>
          <label className="flex cursor-pointer items-center gap-3">
            <div
              className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${noEndDate ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"}`}
              onClick={() => setNoEndDate((v) => !v)}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${noEndDate ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Repeat forever (no end date)
            </span>
          </label>
        </div>

        {/* End date (only if noEndDate is false) */}
        {!noEndDate && (
          <div>
            <Label>End Date <span className="text-gray-400">(optional)</span></Label>
            <AppDatePicker
              value={endDate}
              onChange={(val) => setEndDate(val)}
              min={new Date().toISOString().slice(0, 10)}
            />
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              The recurring schedule will stop after this date.
            </p>
          </div>
        )}

        {/* Preview */}
        <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3.5 dark:border-brand-800 dark:bg-brand-900/10">
          <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">
            Summary
          </p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            This {typeName.toLowerCase()} will repeat{" "}
            <strong>{FREQ_LABELS[frequency].toLowerCase()}</strong>
            {noEndDate
              ? " with no end date."
              : endDate
              ? ` until ${new Date(endDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.`
              : " (no end date specified)."}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditSettingsModal;
