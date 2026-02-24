"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/context/AuthContext";
import expensesService from "@/services/expensesService";
import { formatApiErrorMessage } from "@/utils/apiError";

interface DeleteExpenseModalProps {
  isOpen: boolean;
  expenseId: string | null;
  expenseNumber: string;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteExpenseModal: React.FC<DeleteExpenseModalProps> = ({
  isOpen,
  expenseId,
  expenseNumber,
  onClose,
  onDeleted,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!token || !expenseId) return;
    setError("");
    setLoading(true);

    try {
      await expensesService.deleteExpense(expenseId, token);
      onDeleted();
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
          Delete Expense
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to permanently delete expense{" "}
          <strong className="text-gray-900 dark:text-white">
            {expenseNumber}
          </strong>
          ? This action cannot be undone.
        </p>
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
        <Button
          size="sm"
          onClick={handleDelete}
          disabled={loading}
          className="bg-error-500 hover:bg-error-600"
        >
          {loading ? "Deleting..." : "Delete Expense"}
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteExpenseModal;
