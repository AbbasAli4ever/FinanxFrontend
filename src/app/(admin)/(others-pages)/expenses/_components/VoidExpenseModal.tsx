"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import expensesService from "@/services/expensesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface VoidExpenseModalProps {
  isOpen: boolean;
  expenseId: string | null;
  expenseNumber: string;
  onClose: () => void;
  onVoided: () => void;
}

const VoidExpenseModal: React.FC<VoidExpenseModalProps> = ({
  isOpen,
  expenseId,
  expenseNumber,
  onClose,
  onVoided,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");

  const handleVoid = async () => {
    if (!token || !expenseId) return;
    setError("");
    setLoading(true);

    try {
      await expensesService.voidExpense(
        expenseId,
        { reason: reason || undefined },
        token
      );
      onVoided();
      handleClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    setReason("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Void Expense
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to void expense{" "}
          <strong className="text-gray-900 dark:text-white">
            {expenseNumber}
          </strong>
          ? This action cannot be undone.
        </p>
        <div className="mt-3 rounded-lg border border-warning-200 bg-warning-50 p-3 dark:border-warning-800 dark:bg-warning-900/20">
          <p className="text-xs text-warning-700 dark:text-warning-300">
            Any journal entries associated with this expense will be reversed.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <div className="mb-4">
        <Label>Reason (optional)</Label>
        <TextArea
          value={reason}
          onChange={(val) => setReason(val)}
          placeholder="Reason for voiding this expense"
          rows={3}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleVoid}
          disabled={loading}
          className="bg-error-500 hover:bg-error-600"
        >
          {loading ? "Voiding..." : "Void Expense"}
        </Button>
      </div>
    </Modal>
  );
};

export default VoidExpenseModal;
