"use client";

import React, { useState, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import billsService from "@/services/billsService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { PaymentMethod } from "@/types/bills";

interface RecordBillPaymentModalProps {
  isOpen: boolean;
  billId: string | null;
  billNumber: string;
  amountDue: number;
  onClose: () => void;
  onPaymentRecorded: () => void;
  accounts: { id: string; name: string; accountNumber: string }[];
}

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const RecordBillPaymentModal: React.FC<RecordBillPaymentModalProps> = ({
  isOpen,
  billId,
  billNumber,
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
    paymentMethod: "",
    referenceNumber: "",
    paymentAccountId: "",
    notes: "",
  });

  const resetForm = useCallback(() => {
    setForm({
      amount: amountDue.toFixed(2),
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "",
      referenceNumber: "",
      paymentAccountId: "",
      notes: "",
    });
    setError("");
  }, [amountDue]);

  React.useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !billId) return;

    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }
    if (!form.paymentDate) {
      setError("Please enter a payment date.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await billsService.recordPayment(
        billId,
        {
          amount,
          paymentDate: form.paymentDate,
          paymentMethod: (form.paymentMethod as PaymentMethod) || undefined,
          referenceNumber: form.referenceNumber || undefined,
          notes: form.notes || undefined,
          paymentAccountId: form.paymentAccountId || undefined,
        },
        token
      );
      onPaymentRecorded();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Record Payment
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Record a payment for bill{" "}
          <strong>{billNumber}</strong> •{" "}
          Amount due: <strong className="text-error-500">{formatCurrency(amountDue)}</strong>
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Amount */}
          <div>
            <Label htmlFor="bp-amount">
              Amount <span className="text-error-500">*</span>
            </Label>
            <Input
              id="bp-amount"
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
            <Label htmlFor="bp-date">
              Payment Date <span className="text-error-500">*</span>
            </Label>
            <Input
              id="bp-date"
              type="date"
              value={form.paymentDate}
              onChange={(e) =>
                setForm({ ...form, paymentDate: e.target.value })
              }
            />
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="bp-method">Payment Method</Label>
            <select
              id="bp-method"
              value={form.paymentMethod}
              onChange={(e) =>
                setForm({ ...form, paymentMethod: e.target.value })
              }
              className={`${selectClasses} ${form.paymentMethod ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
            >
              <option value="">Select method</option>
              <option value="CASH">Cash</option>
              <option value="CHECK">Check</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Reference Number */}
          <div>
            <Label htmlFor="bp-ref">Reference Number</Label>
            <Input
              id="bp-ref"
              value={form.referenceNumber}
              onChange={(e) =>
                setForm({ ...form, referenceNumber: e.target.value })
              }
              placeholder="e.g. TRX-001"
            />
          </div>

          {/* Payment Account */}
          <div>
            <Label htmlFor="bp-account">Payment Account</Label>
            <select
              id="bp-account"
              value={form.paymentAccountId}
              onChange={(e) =>
                setForm({ ...form, paymentAccountId: e.target.value })
              }
              className={`${selectClasses} ${form.paymentAccountId ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}
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
              placeholder="Payment notes"
              rows={2}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
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

export default RecordBillPaymentModal;
