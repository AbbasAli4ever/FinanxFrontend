"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import expensesService from "@/services/expensesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface SubmitExpenseModalProps {
  isOpen: boolean;
  expenseId: string | null;
  expenseNumber: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const SubmitExpenseModal: React.FC<SubmitExpenseModalProps> = ({
  isOpen,
  expenseId,
  expenseNumber,
  onClose,
  onSubmitted,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!token || !expenseId) return;
    setError("");
    setLoading(true);

    try {
      await expensesService.submitExpense(expenseId, token);
      onSubmitted();
      handleClose();
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
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Submit for Approval
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Submit expense{" "}
          <strong className="text-gray-900 dark:text-white">
            {expenseNumber}
          </strong>{" "}
          for approval? Once submitted, it will move to Pending Approval status.
        </p>
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            The expense will need to be approved before it can be marked as
            paid. You will not be able to edit it while pending.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Submit for Approval"}
        </Button>
      </div>
    </Modal>
  );
};

export default SubmitExpenseModal;
