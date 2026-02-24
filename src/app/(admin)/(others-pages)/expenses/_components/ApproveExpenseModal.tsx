"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import expensesService from "@/services/expensesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface ApproveExpenseModalProps {
  isOpen: boolean;
  expenseId: string | null;
  expenseNumber: string;
  onClose: () => void;
  onApproved: () => void;
}

const ApproveExpenseModal: React.FC<ApproveExpenseModalProps> = ({
  isOpen,
  expenseId,
  expenseNumber,
  onClose,
  onApproved,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleApprove = async () => {
    if (!token || !expenseId) return;
    setError("");
    setLoading(true);

    try {
      await expensesService.approveExpense(expenseId, token);
      onApproved();
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
          Approve Expense
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Approve expense{" "}
          <strong className="text-gray-900 dark:text-white">
            {expenseNumber}
          </strong>
          ? Once approved, the expense can be marked as paid.
        </p>
        <div className="mt-3 rounded-lg border border-success-200 bg-success-50 p-3 dark:border-success-800 dark:bg-success-900/20">
          <p className="text-xs text-success-700 dark:text-success-300">
            This action will move the expense to Approved status. It can then
            be processed for payment or reimbursement.
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
        <Button size="sm" onClick={handleApprove} disabled={loading}>
          {loading ? "Approving..." : "Approve"}
        </Button>
      </div>
    </Modal>
  );
};

export default ApproveExpenseModal;
