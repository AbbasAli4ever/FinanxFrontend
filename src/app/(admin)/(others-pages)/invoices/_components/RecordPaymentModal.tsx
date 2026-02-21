"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import invoicesService from "@/services/invoicesService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { PaymentMethod } from "@/types/invoices";

interface RecordPaymentModalProps {
  isOpen: boolean;
  invoiceId: string | null;
  invoiceNumber: string;
  amountDue: number;
  onClose: () => void;
  onPaymentRecorded: () => void;
  accounts: { id: string; name: string; accountNumber: string }[];
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CASH", label: "Cash" },
  { value: "CHECK", label: "Check" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "OTHER", label: "Other" },
];

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  invoiceId,
  invoiceNumber,
  amountDue,
  onClose,
  onPaymentRecorded,
  accounts,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    amount: "",
    paymentDate: "",
    paymentMethod: "BANK_TRANSFER" as PaymentMethod,
    referenceNumber: "",
    notes: "",
    depositAccountId: "",
  });

  // Pre-fill when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setForm((prev) => ({
        ...prev,
        amount: amountDue > 0 ? amountDue.toFixed(2) : "",
        paymentDate: new Date().toISOString().split("T")[0],
      }));
    }
  }, [isOpen, amountDue]);

  const resetForm = () => {
    setForm({
      amount: "",
      paymentDate: "",
      paymentMethod: "BANK_TRANSFER",
      referenceNumber: "",
      notes: "",
      depositAccountId: "",
    });
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invoiceId) return;

    setError("");
    setLoading(true);

    try {
      await invoicesService.recordPayment(
        invoiceId,
        {
          amount: parseFloat(form.amount),
          paymentDate: form.paymentDate,
          paymentMethod: form.paymentMethod,
          referenceNumber: form.referenceNumber || undefined,
          notes: form.notes || undefined,
          depositAccountId: form.depositAccountId || undefined,
        },
        token
      );
      onPaymentRecorded();
      handleClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Record Payment
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Invoice {invoiceNumber}
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Due Info */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Amount Due
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(amountDue)}
          </p>
        </div>

        {/* Amount */}
        <div>
          <Label htmlFor="payAmount">
            Amount <span className="text-error-500">*</span>
          </Label>
          <Input
            id="payAmount"
            type="number"
            step={0.01}
            min="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
          />
        </div>

        {/* Payment Date */}
        <div>
          <Label htmlFor="payDate">
            Payment Date <span className="text-error-500">*</span>
          </Label>
          <Input
            id="payDate"
            type="date"
            value={form.paymentDate}
            onChange={(e) =>
              setForm({ ...form, paymentDate: e.target.value })
            }
          />
        </div>

        {/* Payment Method */}
        <div>
          <Label htmlFor="payMethod">Payment Method</Label>
          <select
            id="payMethod"
            value={form.paymentMethod}
            onChange={(e) =>
              setForm({
                ...form,
                paymentMethod: e.target.value as PaymentMethod,
              })
            }
            className={`${selectClasses} text-gray-800 dark:text-white/90`}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reference Number */}
        <div>
          <Label htmlFor="payRef">Reference Number</Label>
          <Input
            id="payRef"
            value={form.referenceNumber}
            onChange={(e) =>
              setForm({ ...form, referenceNumber: e.target.value })
            }
            placeholder="e.g. TXN-001"
          />
        </div>

        {/* Deposit Account */}
        <div>
          <Label htmlFor="payAccount">Deposit Account</Label>
          <select
            id="payAccount"
            value={form.depositAccountId}
            onChange={(e) =>
              setForm({ ...form, depositAccountId: e.target.value })
            }
            className={`${selectClasses} ${form.depositAccountId ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
          >
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.accountNumber} - {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <Label>Notes</Label>
          <TextArea
            value={form.notes}
            onChange={(val) => setForm({ ...form, notes: val })}
            placeholder="Optional notes"
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Recording..." : "Record Payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;
