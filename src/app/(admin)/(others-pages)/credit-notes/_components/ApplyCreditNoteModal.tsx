"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import creditNotesService from "@/services/creditNotesService";
import invoicesService from "@/services/invoicesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface ApplyCreditNoteModalProps {
  isOpen: boolean;
  creditNoteId: string | null;
  creditNoteNumber: string;
  customerId: string;
  remainingCredit: number;
  onClose: () => void;
  onApplied: () => void;
}

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  amountDue: number;
  applyAmount: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const ApplyCreditNoteModal: React.FC<ApplyCreditNoteModalProps> = ({
  isOpen,
  creditNoteId,
  creditNoteNumber,
  customerId,
  remainingCredit,
  onClose,
  onApplied,
}) => {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [fetchingInvoices, setFetchingInvoices] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !token || !customerId) return;
    setFetchingInvoices(true);
    invoicesService.getInvoices({ customerId, status: "SENT", sortBy: "invoiceDate", sortOrder: "asc" }, token)
      .then((data) => {
        setInvoices(data.items.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          amountDue: inv.amountDue,
          applyAmount: 0,
        })));
      })
      .catch(() => {})
      .finally(() => setFetchingInvoices(false));
  }, [isOpen, token, customerId]);

  const totalApplied = invoices.reduce((sum, inv) => sum + inv.applyAmount, 0);
  const isOverLimit = totalApplied > remainingCredit;

  const updateAmount = (id: string, raw: string) => {
    const value = parseFloat(raw) || 0;
    setInvoices((prev) => prev.map((inv) => {
      if (inv.id !== id) return inv;
      const max = Math.min(remainingCredit, inv.amountDue);
      return { ...inv, applyAmount: Math.min(Math.max(0, value), max) };
    }));
  };

  const handleSubmit = async () => {
    if (!token || !creditNoteId) return;
    const applications = invoices.filter((inv) => inv.applyAmount > 0).map((inv) => ({ invoiceId: inv.id, amount: inv.applyAmount }));
    if (applications.length === 0) { setError("Please enter an amount for at least one invoice."); return; }
    if (isOverLimit) { setError("Total application exceeds available credit."); return; }
    setLoading(true); setError("");
    try {
      await creditNotesService.applyCreditNote(creditNoteId, { applications }, token);
      onApplied();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6">
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Apply Credit Note</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Apply <span className="font-semibold">{creditNoteNumber}</span> to outstanding invoices
          </p>
        </div>

        {/* Available Credit Banner */}
        <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 dark:border-brand-800 dark:bg-brand-900/10">
          <span className="text-sm font-medium text-brand-700 dark:text-brand-300">Available Credit</span>
          <span className="text-xl font-bold tabular-nums text-brand-600 dark:text-brand-400">{formatCurrency(remainingCredit)}</span>
        </div>

        {/* Invoice List */}
        {fetchingInvoices ? (
          <div className="flex items-center justify-center gap-2 py-6">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
            <span className="text-sm text-gray-500">Loading invoices...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">No outstanding invoices for this customer.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Invoice</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Amount Due</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Apply Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-2.5 font-medium text-brand-600 dark:text-brand-400">{inv.invoiceNumber}</td>
                    <td className="px-4 py-2.5 text-gray-500">{formatDate(inv.invoiceDate)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-900 dark:text-white/90">{formatCurrency(inv.amountDue)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number"
                        value={inv.applyAmount || ""}
                        onChange={(e) => updateAmount(inv.id, e.target.value)}
                        placeholder="0.00"
                        min="0"
                        max={Math.min(remainingCredit, inv.amountDue)}
                        step={0.01}
                        className="w-28 rounded border border-gray-300 px-2 py-1 text-right text-sm tabular-nums dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Running Total */}
        <div className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold ${
          isOverLimit
            ? "border border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-900/10"
            : "border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40"
        }`}>
          <span className={isOverLimit ? "text-error-700 dark:text-error-400" : "text-gray-700 dark:text-gray-300"}>
            Total to Apply
          </span>
          <span className={`tabular-nums ${isOverLimit ? "text-error-600 dark:text-error-400" : "text-gray-900 dark:text-white"}`}>
            {formatCurrency(totalApplied)}
            {isOverLimit && <span className="ml-1 text-xs font-normal">(exceeds available credit)</span>}
          </span>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={loading || isOverLimit || totalApplied === 0}>
            {loading ? "Applying..." : "Apply Credit"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ApplyCreditNoteModal;
