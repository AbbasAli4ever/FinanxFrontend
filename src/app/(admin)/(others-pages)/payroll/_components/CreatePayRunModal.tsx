"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import AppDatePicker from "@/components/form/AppDatePicker";
import payrollService from "@/services/payrollService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { PayFrequency } from "@/types/payroll";

interface CreatePayRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const inputClasses = "h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";
const selectClasses = "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";
const labelClasses = "mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300";

const SelectWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative">{children}<svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg></div>
);

function todayStr() { return new Date().toISOString().split("T")[0]; }

function getDefaultPeriod(freq: PayFrequency): { start: string; end: string; payDate: string } {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  if (freq === "MONTHLY") {
    const start = new Date(year, month, 1).toISOString().split("T")[0];
    const end = new Date(year, month + 1, 0).toISOString().split("T")[0];
    return { start, end, payDate: end };
  }
  if (freq === "BIWEEKLY") {
    const day = today.getDate();
    const weekStart = new Date(today); weekStart.setDate(day - today.getDay());
    const start = weekStart.toISOString().split("T")[0];
    const end = new Date(weekStart); end.setDate(weekStart.getDate() + 13);
    return { start, end: end.toISOString().split("T")[0], payDate: end.toISOString().split("T")[0] };
  }
  return { start: todayStr(), end: todayStr(), payDate: todayStr() };
}

const CreatePayRunModal: React.FC<CreatePayRunModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [payFrequency, setPayFrequency] = useState<PayFrequency>("MONTHLY");
  const [payPeriodStart, setPayPeriodStart] = useState("");
  const [payPeriodEnd, setPayPeriodEnd] = useState("");
  const [payDate, setPayDate] = useState("");
  const [notes, setNotes] = useState("");

  const applyDefaults = (freq: PayFrequency) => {
    const d = getDefaultPeriod(freq);
    setPayPeriodStart(d.start);
    setPayPeriodEnd(d.end);
    setPayDate(d.payDate);
  };

  useEffect(() => {
    if (isOpen) { applyDefaults("MONTHLY"); setPayFrequency("MONTHLY"); setNotes(""); setError(null); }
  }, [isOpen]);

  const handleFrequencyChange = (freq: PayFrequency) => {
    setPayFrequency(freq);
    applyDefaults(freq);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!payPeriodStart || !payPeriodEnd || !payDate) {
      setError("Pay period start, end, and pay date are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await payrollService.createPayRun({
        payPeriodStart,
        payPeriodEnd,
        payDate,
        payFrequency,
        notes: notes.trim() || undefined,
      }, token);
      onCreated();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const freqDescriptions: Record<PayFrequency, string> = {
    WEEKLY: "52 periods/year · 40 default hours",
    BIWEEKLY: "26 periods/year · 80 default hours",
    SEMIMONTHLY: "24 periods/year · 86.67 default hours",
    MONTHLY: "12 periods/year · 173.33 default hours",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg mx-4 my-6">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Pay Run</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Define the pay period and schedule for this payroll run.</p>
        </div>

        {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Frequency */}
          <div>
            <label className={labelClasses}>Pay Frequency <span className="text-error-500">*</span></label>
            <SelectWrapper>
              <select value={payFrequency} onChange={(e) => handleFrequencyChange(e.target.value as PayFrequency)} className={selectClasses}>
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Bi-Weekly</option>
                <option value="SEMIMONTHLY">Semi-Monthly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </SelectWrapper>
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{freqDescriptions[payFrequency]}</p>
          </div>

          {/* Pay period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Period Start <span className="text-error-500">*</span></label>
              <AppDatePicker value={payPeriodStart} onChange={(val) => setPayPeriodStart(val)} maxToday required />
            </div>
            <div>
              <label className={labelClasses}>Period End <span className="text-error-500">*</span></label>
              <AppDatePicker value={payPeriodEnd} onChange={(val) => setPayPeriodEnd(val)} min={payPeriodStart} maxToday required />
            </div>
          </div>

          {/* Pay date */}
          <div>
            <label className={labelClasses}>Pay Date <span className="text-error-500">*</span></label>
            <AppDatePicker value={payDate} onChange={(val) => setPayDate(val)} min={payPeriodEnd} required />
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">The date employees will receive their payment.</p>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClasses}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. March payroll, Q1 bonus included..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 resize-none"
            />
          </div>

          {/* Info box */}
          <div className="rounded-xl bg-brand-50 p-4 dark:bg-brand-900/10">
            <p className="text-xs font-medium text-brand-700 dark:text-brand-300">Next steps after creation</p>
            <ul className="mt-2 space-y-1">
              {["Auto-generate items for all matching employees", "Add or adjust individual pay items", "Submit for approval when ready"].map((step, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 text-[9px] font-bold dark:bg-brand-800">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button size="sm" type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </span>
              ) : "Create Pay Run"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreatePayRunModal;
