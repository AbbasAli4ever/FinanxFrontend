"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import expensesService from "@/services/expensesService";
import { formatApiErrorMessage } from "@/utils/apiError";
import type { PaymentMethod } from "@/types/expenses";

interface MarkPaidModalProps {
  isOpen: boolean;
  expenseId: string | null;
  expenseNumber: string;
  isReimbursable: boolean;
  onClose: () => void;
  onMarkedPaid: () => void;
  accounts: { id: string; name: string; accountNumber: string }[];
}

const selectClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

const MarkPaidModal: React.FC<MarkPaidModalProps> = ({
  isOpen,
  expenseId,
  expenseNumber,
  isReimbursable,
  onClose,
  onMarkedPaid,
  accounts,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState("");

  const handleMarkPaid = async () => {
    if (!token || !expenseId) return;
    setError("");
    setLoading(true);

    try {
      await expensesService.markPaid(
        expenseId,
        {
          paymentMethod: (paymentMethod as PaymentMethod) || undefined,
          paymentAccountId: paymentAccountId || undefined,
        },
        token
      );
      onMarkedPaid();
      handleClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    setPaymentMethod("");
    setPaymentAccountId("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isReimbursable ? "Mark as Reimbursed" : "Mark as Paid"}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Mark expense{" "}
          <strong className="text-gray-900 dark:text-white">
            {expenseNumber}
          </strong>{" "}
          as {isReimbursable ? "reimbursed" : "paid"}?
        </p>
        <div className="mt-3 rounded-lg border border-success-200 bg-success-50 p-3 dark:border-success-800 dark:bg-success-900/20">
          <p className="text-xs text-success-700 dark:text-success-300">
            {isReimbursable
              ? "This will mark the expense as reimbursed to the employee."
              : "This will record the expense as paid and create the corresponding journal entry."}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <Label>Payment Method</Label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className={selectClasses}
          >
            <option value="">Select method (optional)</option>
            <option value="CASH">Cash</option>
            <option value="CHECK">Check</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <Label>Payment Account</Label>
          <select
            value={paymentAccountId}
            onChange={(e) => setPaymentAccountId(e.target.value)}
            className={selectClasses}
          >
            <option value="">Select account (optional)</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.accountNumber} — {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleMarkPaid} disabled={loading}>
          {loading
            ? "Processing..."
            : isReimbursable
              ? "Mark Reimbursed"
              : "Mark Paid"}
        </Button>
      </div>
    </Modal>
  );
};

export default MarkPaidModal;
