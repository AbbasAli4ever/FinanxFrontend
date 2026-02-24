"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import expensesService from "@/services/expensesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface RejectExpenseModalProps {
  isOpen: boolean;
  expenseId: string | null;
  expenseNumber: string;
  onClose: () => void;
  onRejected: () => void;
}

const RejectExpenseModal: React.FC<RejectExpenseModalProps> = ({
  isOpen,
  expenseId,
  expenseNumber,
  onClose,
  onRejected,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");

  const handleReject = async () => {
    if (!token || !expenseId) return;
    if (!reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await expensesService.rejectExpense(
        expenseId,
        { reason: reason.trim() },
        token
      );
      onRejected();
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
          Reject Expense
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Reject expense{" "}
          <strong className="text-gray-900 dark:text-white">
            {expenseNumber}
          </strong>
          ? A reason is required.
        </p>
        <div className="mt-3 rounded-lg border border-error-200 bg-error-50 p-3 dark:border-error-800 dark:bg-error-900/20">
          <p className="text-xs text-error-700 dark:text-error-300">
            The expense will be moved to Rejected status. The submitter can
            edit and resubmit it.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <div className="mb-4">
        <Label>
          Rejection Reason <span className="text-error-500">*</span>
        </Label>
        <TextArea
          value={reason}
          onChange={(val) => setReason(val)}
          placeholder="Explain why this expense is being rejected..."
          rows={3}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleReject}
          disabled={loading || !reason.trim()}
          className="bg-error-500 hover:bg-error-600"
        >
          {loading ? "Rejecting..." : "Reject Expense"}
        </Button>
      </div>
    </Modal>
  );
};

export default RejectExpenseModal;
